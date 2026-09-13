import type { EntityData, EntityId } from './entity';

export const entityEventTypes = {
    created: 'entity-created',
    updated: 'entity-updated',
    deleted: 'entity-deleted',
} as const;

export type EntityEventType = (typeof entityEventTypes)[keyof typeof entityEventTypes];

export const entityMutationErrorCodes = {
    versionConflict: 'entity-version-conflict',
    alreadyExists: 'entity-already-exists',
} as const;

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
