import type { EntityProperty, EntityType } from '@poseidon/models';
import { system } from '../system';
import { systemFields, type BootstrapContext } from './system-fields';

export function createCoreEntityTypes(
    context: BootstrapContext,
    properties: EntityProperty[],
): EntityType[] {
    return Object.values(system.entityTypes).map((definition) => ({
        ...systemFields(definition.name, 'entity-type', context),
        ...definition,
        actions:
            'actions' in definition
                ? Object.values(definition.actions).map(({ code: _code, ...action }) => action)
                : undefined,
        properties: properties.filter((property) => property.entityTypeId === definition.name),
    }));
}
