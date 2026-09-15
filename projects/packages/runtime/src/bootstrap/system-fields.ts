import type { Entity, EntityId } from '@poseidon/models';

export interface BootstrapContext {
    systemUserId: EntityId;
    now: Date;
}

export function systemFields(
    id: EntityId,
    entityTypeId: EntityId,
    context: BootstrapContext,
): Entity {
    return {
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: context.now.toISOString(),
        _createdBy: context.systemUserId,
    };
}
