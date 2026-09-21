import type { APIAction, EntityProperty, EntityType } from '@poseidon/models';
import { defaultAction } from '../default-action';
import { system } from './index';
import { createCoreProperties } from './system-properties';

export function createCoreEntityTypes(
    properties: EntityProperty[] = createCoreProperties(),
): EntityType[] {
    return Object.values(system.entityTypes).map((definition) => ({
        _id: definition.name,
        ...definition,
        ...(definition.name === 'entity-type' ? { actions: entityTypeActions } : {}),
        properties: properties.filter((property) => property._id.startsWith(`${definition.name}:`)),
    }));
}

const addMandatoryProperties: APIAction = {
    id: 'addMandatoryProperties',
    name: 'addMandatoryProperties',
    label: 'Add mandatory properties',
    enabled: true,
    before: [],
};

const entityTypeActions: APIAction[] = ['create', 'update'].map((name) => {
    const action = defaultAction(name)!;
    return { ...action, before: [addMandatoryProperties, ...action.before] };
});
