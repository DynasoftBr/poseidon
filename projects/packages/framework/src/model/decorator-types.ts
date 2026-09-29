import type {
    EntityProperty,
    OnDeleteBehavior,
    PropertyType,
} from '../entity-types/entity-property';
import type { EntityType } from '../entity-types/entity-type';
import type { RelationshipMetadata } from './relationship-metadata';
import type { OperationKind } from './operation-address';

/** A class used to collect decorator metadata without instantiation. */
export type EntityClass<T = object> = abstract new (...args: never[]) => T;

/** Name defaults to kebab-case; label defaults to the class name. Structure marks an embedded type. */
export type EntityTypeOptions = Partial<
    Pick<EntityType, 'name' | 'label' | 'description' | 'structure'>
>;

/** Explicit property type and constraints; the decorated member supplies its name. */
export type PropertyOptions = Omit<EntityProperty, '_id' | '_version' | 'name' | 'itemsType'> & {
    itemsType?: PropertyType | EntityClass;
};

export type ActionMethod = (...args: never[]) => Promise<unknown>;

export type OperationOptions = {
    description: string;
    name?: string;
    allows?: [];
    permissions: () => ActionMethod[];
};

export type ActionOptions = OperationOptions;
export type QueryOptions = OperationOptions;

export type RelationshipOptions = {
    onDelete?: OnDeleteBehavior;
};

export type DecoratedRelationshipMetadata = RelationshipOptions & RelationshipMetadata;

export type OperationMetadata<TOptions extends OperationOptions = OperationOptions> = TOptions & {
    kind: OperationKind;
    method: ActionMethod;
    name: string;
};
