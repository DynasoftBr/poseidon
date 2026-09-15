import type { EntityProperty, EntityType } from '@poseidon/models';
import { systemFields, type BootstrapContext } from './system-fields';

export function createCoreEntityTypes(
    context: BootstrapContext,
    properties: EntityProperty[],
): EntityType[] {
    return coreEntityTypeNames.map((name) => ({
        ...systemFields(name, 'entity-type', context),
        name,
        ...coreEntityTypeMetadata[name],
        properties: properties
            .filter((property) => property.entityTypeId === name)
            .map((property) => property._id),
    }));
}

const coreEntityTypeMetadata: Record<
    string,
    { label: string; pluralLabel: string; description: string; menuLocation: string }
> = {
    'entity-type': {
        label: 'Entity type',
        pluralLabel: 'Entity types',
        description: 'Defines the structure and behaviour of an entity.',
        menuLocation: 'Platform',
    },
    'entity-property': {
        label: 'Entity property',
        pluralLabel: 'Entity properties',
        description: 'Defines a property on an entity type.',
        menuLocation: 'Platform',
    },
    index: {
        label: 'Index',
        pluralLabel: 'Indexes',
        description: 'Defines an index over entity properties.',
        menuLocation: 'Platform',
    },
    user: {
        label: 'User',
        pluralLabel: 'Users',
        description: 'Represents a user of the platform.',
        menuLocation: 'Platform',
    },
    identity: {
        label: 'Identity',
        pluralLabel: 'Identities',
        description: 'Represents an identity and its memberships.',
        menuLocation: 'Platform',
    },
    'relation-link': {
        label: 'Relation link',
        pluralLabel: 'Relation links',
        description: 'Records a relationship between entities.',
        menuLocation: 'Platform',
    },
};

export const coreEntityTypeNames = Object.keys(coreEntityTypeMetadata);
