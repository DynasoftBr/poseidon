import { toMongoSpecification } from './mongo-specification';
import {
    entityMutationErrorCodes,
    type EntityEvent,
    type Entity,
    type QueryEntitiesCommand,
} from '@poseidon/models';
import type { ClientSession, MongoClient } from 'mongodb';

export class MongoEventProjectionStore {
    public constructor(private readonly client: MongoClient) {}

    public async isInitialized(): Promise<boolean> {
        const systemUser = await this.getEntities().findOne({ _id: 'system' });

        return systemUser !== null;
    }

    public async hasEntity(id: string): Promise<boolean> {
        return (await this.getEntities().findOne({ _id: id })) !== null;
    }

    public async findProjection(id: string): Promise<Entity | null> {
        const projection = await this.getProjectionCollection().findOne({ _id: id });

        if (!projection) {
            return null;
        }

        return {
            id: projection._id,
            entityTypeId: projection.entityTypeId,
            data: projection.data,
            version: projection.version,
            createdAt: projection.createdAt,
            createdById: projection.createdById,
            changedAt: projection.changedAt,
            changedById: projection.changedById,
            deletedAt: projection.deletedAt,
            deletedById: projection.deletedById,
        };
    }

    public async findByEntityType(
        command: QueryEntitiesCommand,
        propertyNames: ReadonlyMap<string, string>,
    ): Promise<Entity[]> {
        const documents = await this.getProjectionCollection()
            .find({
                entityTypeId: command.entityTypeId,
                deletedAt: { $exists: false },
                ...(command.filter === undefined
                    ? {}
                    : { $expr: toMongoSpecification(command.filter, propertyNames) }),
            })
            .skip(command.offset ?? 0)
            .limit(command.limit ?? 100)
            .toArray();

        return documents.map((document) => ({
            id: document._id,
            entityTypeId: document.entityTypeId,
            data: document.data,
            version: document.version,
            createdAt: document.createdAt,
            createdById: document.createdById,
            changedAt: document.changedAt,
            changedById: document.changedById,
        }));
    }

    public async commit(events: EntityEvent[]): Promise<void> {
        const session = this.client.startSession();

        try {
            await session.withTransaction(() => this.commitTransaction(events, session));
        } finally {
            await session.endSession();
        }
    }

    private async commitTransaction(events: EntityEvent[], session: ClientSession): Promise<void> {
        await this.writeEvents(events, session);
        await this.writeProjections(events, session);
    }

    private async writeEvents(events: EntityEvent[], session: ClientSession): Promise<void> {
        const operations = events.map((event) => ({
            updateOne: {
                filter: { _id: event.id },
                update: { $setOnInsert: { ...event, _id: event.id } },
                upsert: true,
            },
        }));

        await this.getEvents().bulkWrite(operations, { session });
    }

    private async writeProjections(events: EntityEvent[], session: ClientSession): Promise<void> {
        for (const event of events) {
            if (event.type === 'entity-created') {
                try {
                    await this.getEntities().insertOne(
                        {
                            _id: event.entityId,
                            entityTypeId: event.entityTypeId,
                            data: event.data,
                            version: 1,
                            createdAt: event.occurredAt,
                            createdById: event.actorId,
                        },
                        { session },
                    );
                } catch (error: unknown) {
                    if (isDuplicateKeyError(error)) {
                        throw new ProjectionAlreadyExistsError(event.entityId);
                    }
                    throw error;
                }
                continue;
            }

            const result = await this.getEntities().updateOne(
                {
                    _id: event.entityId,
                    entityTypeId: event.entityTypeId,
                    version: event.expectedVersion,
                    deletedAt: { $exists: false },
                },
                event.type === 'entity-updated'
                    ? {
                          $set: {
                              data: event.data,
                              changedAt: event.occurredAt,
                              changedById: event.actorId,
                          },
                          $inc: { version: 1 },
                      }
                    : {
                          $set: {
                              deletedAt: event.occurredAt,
                              deletedById: event.actorId,
                          },
                          $inc: { version: 1 },
                      },
                { session },
            );

            if (result.matchedCount !== 1) {
                throw new ProjectionVersionConflictError(event.entityId);
            }
        }
    }

    private getEvents() {
        return this.client.db().collection<{ _id: string }>('events');
    }

    private getEntities() {
        return this.client.db().collection<StoredProjection>('entities');
    }

    private getProjectionCollection() {
        return this.client.db().collection<StoredProjection>('entities');
    }
}

class ProjectionVersionConflictError extends Error {
    public readonly code = entityMutationErrorCodes.versionConflict;

    public constructor(entityId: string) {
        super(`Entity projection '${entityId}' version mismatch.`);
        this.name = 'ProjectionVersionConflictError';
    }
}

class ProjectionAlreadyExistsError extends Error {
    public readonly code = entityMutationErrorCodes.alreadyExists;
    public constructor(entityId: string) {
        super(`Entity projection '${entityId}' already exists.`);
        this.name = 'ProjectionAlreadyExistsError';
    }
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

type StoredProjection = Omit<Entity, 'id'> & { _id: string };
