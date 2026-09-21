import type { EntityId, EntityProperty, EntityPropertyData, PropertyType } from '@poseidon/models';
import type { BootstrapContext } from './system-fields';

export function createProperty(
    [entityTypeId, name, type, required]: [EntityId, string, PropertyType, boolean],
    _context: BootstrapContext,
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
