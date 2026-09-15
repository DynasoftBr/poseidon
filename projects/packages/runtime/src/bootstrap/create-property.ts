import type { EntityId, EntityProperty, EntityPropertyData, PropertyType } from '@poseidon/models';
import { systemFields, type BootstrapContext } from './system-fields';

export function createProperty(
    [entityTypeId, name, type, required]: [EntityId, string, PropertyType, boolean],
    context: BootstrapContext,
    options: Partial<EntityPropertyData> = {},
): EntityProperty {
    return {
        ...systemFields(`${entityTypeId}:${name}`, 'entity-property', context),
        entityTypeId,
        name,
        type,
        required,
        ...options,
    };
}
