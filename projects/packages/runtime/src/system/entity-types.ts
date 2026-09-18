import type {
    Entity,
    EntityProperty,
    EntityType,
    Identity,
    IndexDefinition,
    Script,
    SystemUser,
} from '@poseidon/models';

export interface SystemEntityTypeDefinition<
    TEntity extends Entity | EntityProperty,
    TName extends string = string,
> {
    name: TName;
    label: string;
    structure?: boolean;
    pluralLabel: string;
    description: string;
    menuLocation: string;
    entity?: TEntity;
}

function defineEntityType<TEntity extends Entity | EntityProperty>() {
    return <const TName extends string>(
        definition: Omit<SystemEntityTypeDefinition<TEntity, TName>, 'entity'>,
    ): SystemEntityTypeDefinition<TEntity, TName> => definition;
}

export const systemEntityTypes = {
    entityType: defineEntityType<EntityType>()({
        name: 'entity-type',
        label: 'Entity type',
        pluralLabel: 'Entity types',
        description: 'Defines the structure and behaviour of an entity.',
        menuLocation: 'Platform',
    }),
    entityProperty: defineEntityType<EntityProperty>()({
        name: 'entity-property',
        structure: true,
        label: 'Entity property',
        pluralLabel: 'Entity properties',
        description: 'Defines a property on an entity type.',
        menuLocation: 'Platform',
    }),
    index: defineEntityType<IndexDefinition>()({
        name: 'index',
        label: 'Index',
        pluralLabel: 'Indexes',
        description: 'Defines an index over entity properties.',
        menuLocation: 'Platform',
    }),
    user: defineEntityType<SystemUser>()({
        name: 'user',
        label: 'User',
        pluralLabel: 'Users',
        description: 'Represents a user of the platform.',
        menuLocation: 'Platform',
    }),
    identity: defineEntityType<Identity>()({
        name: 'identity',
        label: 'Identity',
        pluralLabel: 'Identities',
        description: 'Represents an identity and its memberships.',
        menuLocation: 'Platform',
    }),
    relationLink: defineEntityType<Entity>()({
        name: 'relation-link',
        label: 'Relation link',
        pluralLabel: 'Relation links',
        description: 'Records a relationship between entities.',
        menuLocation: 'Platform',
    }),
    script: defineEntityType<Script>()({
        name: 'script',
        label: 'Script',
        pluralLabel: 'Scripts',
        description: 'Defines executable code for an API action.',
        menuLocation: 'Platform',
    }),
} as const;

type SystemEntityTypes = typeof systemEntityTypes;
type SystemEntityTypeDefinitionUnion = SystemEntityTypes[keyof SystemEntityTypes];
type DefinitionForName<TName extends string> = SystemEntityTypeDefinitionUnion extends infer T
    ? T extends { name: TName }
        ? T
        : never
    : never;

export type EntityForTypeName<TName extends string> =
    DefinitionForName<TName> extends SystemEntityTypeDefinition<infer TEntity>
        ? Extract<TEntity, Entity>
        : Entity;

export const systemEntityTypeNames = Object.values(systemEntityTypes).map(({ name }) => name);
