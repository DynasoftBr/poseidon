import type { EntityType } from '../entity-types/entity-type';
import type { Action } from '../entity-types/action';
import type { Query } from '../entity-types/query';
import type { EntityProperty } from '../entity-types/entity-property';

export type EntityPropertyDefinition = Omit<EntityProperty, '_version'>;
export type ActionDefinition = Omit<Action, '_version'>;
export type QueryDefinition = Omit<Query, '_version'>;

/** Complete authored definition used to create an EntityType and its child entities. */
export type EntityTypeDefinition = Omit<
    EntityType,
    '_version' | 'delete' | 'execute' | 'get' | 'save' | 'properties' | 'actions' | 'queries'
> & {
    properties: EntityPropertyDefinition[];
    actions?: ActionDefinition[];
    queries?: QueryDefinition[];
};
