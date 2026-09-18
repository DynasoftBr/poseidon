import { randomUUID } from 'node:crypto';
import type { Entity, EntityData } from '@poseidon/models';

export function initializeEntityMetadata(
    data: EntityData,
    entityTypeName: string,
    actorId: string,
): Entity {
    return {
        ...data,
        _id: typeof data._id === 'string' ? data._id : randomUUID(),
        _entityTypeId: entityTypeName,
        _version: 1,
        _createdAt: new Date().toISOString(),
        _createdBy: actorId,
    };
}
