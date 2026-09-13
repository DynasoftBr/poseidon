import {
    entityMutationErrorCodes,
    type EntityEvent,
    type EntityFilter,
    type EntityProjection,
    type QueryEntitiesCommand,
} from '@poseidon/model';
import type { ClientSession, Connection } from 'mongoose';

export class MongoEventProjectionStore {
    public constructor(private readonly connection: Connection) {}

    public async isInitialized(): Promise<boolean> {
        const systemUser = await this.getEntities().findOne({ _id: 'system' });

        return systemUser !== null;
    }

    public async hasEntity(id: string): Promise<boolean> {
        return (await this.getEntities().findOne({ _id: id })) !== null;
    }

    public async findProjection(id: string): Promise<EntityProjection | null> {
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

    public async findByEntityType(command: QueryEntitiesCommand): Promise<EntityProjection[]> {
        const documents = await this.getProjectionCollection()
            .find({
                entityTypeId: command.entityTypeId,
                deletedAt: { $exists: false },
                ...toMongoFilter(command.filter),
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
        const session = await this.connection.startSession();

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
                await this.getEntities().updateOne(
                    { _id: event.entityId },
                    {
                        $setOnInsert: {
                            _id: event.entityId,
                            entityTypeId: event.entityTypeId,
                            data: event.data,
                            version: 1,
                            createdAt: event.occurredAt,
                            createdById: event.actorId,
                        },
                    },
                    { upsert: true, session },
                );
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
        return this.connection.collection<{ _id: string }>('events');
    }

    private getEntities() {
        return this.connection.collection<{ _id: string }>('entities');
    }

    private getProjectionCollection() {
        return this.connection.collection<StoredProjection>('entities');
    }
}

class ProjectionVersionConflictError extends Error {
    public readonly code = entityMutationErrorCodes.versionConflict;

    public constructor(entityId: string) {
        super(`Entity projection '${entityId}' version mismatch.`);
        this.name = 'ProjectionVersionConflictError';
    }
}

interface StoredProjection {
    _id: string;
    entityTypeId: string;
    data: Record<string, unknown>;
    version: number;
    createdAt: Date;
    createdById: string;
    changedAt?: Date;
    changedById?: string;
    deletedAt?: Date;
    deletedById?: string;
}

function toMongoFilter(filter: EntityFilter | undefined): Record<string, unknown> {
    if (!filter) return {};

    if (filter.operator === 'equals') {
        return { [`data.${validatePropertyName(filter.property)}`]: filter.value };
    }
    if (filter.operator === 'contains') {
        return { [`data.${validatePropertyName(filter.property)}`]: { $in: [filter.value] } };
    }

    const conditions = filter.filters.map(toMongoFilter);
    return filter.operator === 'and' ? { $and: conditions } : { $or: conditions };
}

function validatePropertyName(property: string): string {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(property)) {
        throw new Error(`Invalid query property '${property}'.`);
    }

    return property;
}
