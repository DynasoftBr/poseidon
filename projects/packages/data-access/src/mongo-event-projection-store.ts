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
        return await this.getProjectionCollection().findOne({ _id: id });
    }

    public async findByEntityType(
        command: QueryEntitiesCommand,
        propertyNames: ReadonlyMap<string, string>,
    ): Promise<Entity[]> {
        const documents = await this.getProjectionCollection()
            .find({
                _entityTypeId: command.entityTypeId,
                _deletedAt: { $exists: false },
                ...(command.filter === undefined
                    ? {}
                    : { $expr: toMongoSpecification(command.filter, propertyNames) }),
            })
            .skip(command.offset ?? 0)
            .limit(command.limit ?? 100)
            .toArray();

        return documents;
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
                            _entityTypeId: event.entityTypeId,
                            ...event.data,
                            _version: 1,
                            _createdAt: event.occurredAt.toISOString(),
                            _createdBy: event.actorId,
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
                    _entityTypeId: event.entityTypeId,
                    _version: event.expectedVersion,
                    _deletedAt: { $exists: false },
                },
                event.type === 'entity-updated'
                    ? {
                          $set: {
                              ...event.data,
                              _changedAt: event.occurredAt.toISOString(),
                              _changedBy: event.actorId,
                              _version: (event.expectedVersion ?? 0) + 1,
                          },
                      }
                    : {
                          $set: {
                              _deletedAt: event.occurredAt.toISOString(),
                              _deletedBy: event.actorId,
                              _version: (event.expectedVersion ?? 0) + 1,
                          },
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
        return this.client.db().collection<Entity>('entities');
    }

    private getProjectionCollection() {
        return this.client.db().collection<Entity>('entities');
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
