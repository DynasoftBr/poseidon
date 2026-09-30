import type { EntityType } from '../entity-types/entity-type';
import type { Action } from '../entity-types/action';
import type { Query } from '../entity-types/query';
import type { EntityProperty } from '../entity-types/entity-property';

/** Authored property definition with an optional persistent identifier. */
export type EntityPropertyDefinition = Omit<EntityProperty, '_id' | '_version'> & {
    /** Persistent identifier of the {@link EntityProperty}. */
    _id?: EntityProperty['_id'];
};
/** Authored {@link Action} definition without a persistence version. */
export type ActionDefinition = Omit<Action, '_version'>;
/** Authored {@link Query} definition without a persistence version. */
export type QueryDefinition = Omit<Query, '_version'>;

/** Complete authored definition used to create an {@link EntityType} and its child entities. */
export type EntityTypeDefinition = Omit<
    EntityType,
    '_version' | 'delete' | 'execute' | 'get' | 'save' | 'properties' | 'actions' | 'queries'
> & {
    /** Authored {@link EntityPropertyDefinition} values. */
    properties: EntityPropertyDefinition[];
    /** Authored {@link Action} definitions. */
    actions?: ActionDefinition[];
    /** Authored {@link Query} definitions. */
    queries?: QueryDefinition[];
};
