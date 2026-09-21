import type { Entity, EntityProperty, EntityType } from '@poseidon/models';

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
