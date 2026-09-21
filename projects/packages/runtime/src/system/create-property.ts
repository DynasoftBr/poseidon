import type { EntityId, EntityProperty, EntityPropertyData, PropertyType } from '@poseidon/models';

export function createProperty(
    [entityTypeId, name, type, required]: [EntityId, string, PropertyType, boolean],
    options: Partial<EntityPropertyData> = {},
): EntityProperty {
    return {
        _id: `${entityTypeId}:${name}`,
        name,
        type,
        required,
        ...options,
    };
}
