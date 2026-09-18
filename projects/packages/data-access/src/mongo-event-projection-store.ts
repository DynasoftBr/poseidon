import { findEntities } from './mongo-entity-query';
import {
    entityMutationErrorCodes,
    type EntityEvent,
    type Entity,
    type QueryEntitiesAction,
} from '@poseidon/models';
import type { ClientSession, MongoClient } from 'mongodb';

export class MongoEventProjectionStore {
    public constructor(private readonly client: MongoClient) {}

    public async isInitialized(): Promise<boolean> {
        const systemUser = await this.getEntities('user').findOne({ _id: 'system' });

        return systemUser !== null;
    }

    public async hasEntity(entityTypeName: string, id: string): Promise<boolean> {
        return (await this.getEntities(entityTypeName).findOne({ _id: id })) !== null;
    }

    public async findProjection(entityTypeName: string, id: string): Promise<Entity | null> {
        return await this.getEntities(entityTypeName).findOne({ _id: id });
    }

    public async findEntityTypeByName(name: string): Promise<Entity | null> {
        return await this.getEntities('entity-type').findOne({
            name,
            _deletedAt: { $exists: false },
        });
    }

    public async findByEntityType(
        entityTypeName: string,
        action: QueryEntitiesAction,
        _propertyNames: ReadonlyMap<string, string>,
    ): Promise<Entity[]> {
        return await findEntities(this.client, entityTypeName, action);
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
            const entityTypeName = await this.resolveEntityTypeName(event.entityTypeId, session);
            if (event.type === 'entity-created') {
                try {
                    await this.getEntities(entityTypeName).insertOne(
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

            const result = await this.getEntities(entityTypeName).updateOne(
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

    private async resolveEntityTypeName(
        entityTypeId: string,
        session: ClientSession,
    ): Promise<string> {
        if (entityTypeId === 'entity-type') return 'entity-type';
        const entityType = await this.getEntities('entity-type').findOne(
            { _id: entityTypeId },
            { session },
        );
        if (typeof entityType?.name !== 'string') {
            throw new Error(`Entity type '${entityTypeId}' does not exist.`);
        }
        if (entityType.structure === true) {
            throw new Error(`Structure '${entityType.name}' cannot be persisted independently.`);
        }
        return entityType.name;
    }

    private getEntities(entityTypeName: string) {
        return this.client.db().collection<Entity>(entityTypeName);
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
