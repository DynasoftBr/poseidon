import type { EntityData, EntityProperty } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';
import { createSystemProperties } from '../../bootstrap/system-properties';
import { ValidationError } from '../../poseidon-error';

export function addMandatoryProperties(
    payload: EntityData,
    _storage: DataStorage,
    actorId: string,
): EntityData {
    const entityTypeId = payload._id;
    if (typeof entityTypeId !== 'string') {
        throw new ValidationError([{ property: '_id', message: 'Entity type ID is required.' }]);
    }
    if (payload.structure === true) return payload;
    const declared = Array.isArray(payload.properties) ? payload.properties : [];
    if (!declared.every((property) => typeof property === 'object' && property !== null)) {
        throw new ValidationError([
            {
                property: 'properties',
                message: 'Entity type properties must be embedded structures.',
            },
        ]);
    }
    const propertyIds = new Set(declared.map((property: EntityProperty) => property._id));
    const mandatory = createSystemProperties(entityTypeId, {
        systemUserId: actorId,
        now: new Date(),
    }).filter((property) => !propertyIds.has(property._id));
    return { ...payload, properties: [...declared, ...mandatory] };
}
