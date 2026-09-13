import type { EntityId } from './entity';

export const entityEventTypes = {
    created: 'entity-created',
    updated: 'entity-updated',
    deleted: 'entity-deleted',
} as const;

export type EntityEventType = (typeof entityEventTypes)[keyof typeof entityEventTypes];

export const entityMutationErrorCodes = {
    versionConflict: 'entity-version-conflict',
} as const;

export type EntityData = Record<string, unknown>;

export interface EntityEvent {
    id: EntityId;
    type: EntityEventType;
    entityTypeId: EntityId;
    entityId: EntityId;
    data: EntityData;
    occurredAt: Date;
    actorId: EntityId;
    expectedVersion?: number;
}

export interface EntityProjection {
    id: EntityId;
    entityTypeId: EntityId;
    data: EntityData;
    version: number;
    createdAt: Date;
    createdById: EntityId;
    changedAt?: Date;
    changedById?: EntityId;
    deletedAt?: Date;
    deletedById?: EntityId;
}
