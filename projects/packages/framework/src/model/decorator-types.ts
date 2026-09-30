import type {
    EntityProperty,
    OnDeleteBehavior,
    PropertyType,
} from '../entity-types/entity-property';
import type { EntityType } from '../entity-types/entity-type';
import type { RelationshipMetadata } from './relationship-metadata';
import type { OperationKind } from './operation-address';

/**
 * A class used to collect decorator metadata without instantiation.
 * @template T - Entity or value shape represented by this declaration.
 */
export type EntityClass<T = object> = abstract new (...args: never[]) => T;

/** Name defaults to kebab-case; label defaults to the class name. Structure marks an embedded type. */
export type EntityTypeOptions = Partial<
    Pick<EntityType, 'name' | 'label' | 'description' | 'structure'>
>;

/** Explicit property type and constraints; the decorated member supplies its name. */
export type PropertyOptions = Omit<EntityProperty, '_id' | '_version' | 'name' | 'itemsType'> & {
    /** {@link PropertyType} or {@link EntityClass} used for array elements. */
    itemsType?: PropertyType | EntityClass;
};

/** Callable signature used to reference a decorated operation. */
export type ActionMethod = (...args: never[]) => Promise<unknown>;

/** Authored metadata and permission dependencies for an operation. */
export type OperationOptions = {
    /** Human-readable explanation of the operation. */
    description: string;
    /** Name used to identify the operation. */
    name?: string;
    /** Explicit declaration of an empty allow list. */
    allows?: [];
    /** Deferred {@link ActionMethod} references to operations required by this operation. */
    permissions: () => ActionMethod[];
};

/** Options for declaring an Action. */
export type ActionOptions = OperationOptions;
/** Options for declaring a Query. */
export type QueryOptions = OperationOptions;

/** Persistence behavior for a relationship. */
export type RelationshipOptions = {
    /** {@link OnDeleteBehavior} applied when a related entity is deleted. */
    onDelete?: OnDeleteBehavior;
};

/** Relationship target, inverse path, and persistence options. */
export type DecoratedRelationshipMetadata = RelationshipOptions & RelationshipMetadata;

/**
 * Resolved declaration and method for a decorated operation.
 * @template TOptions - Options associated with the decorated operation.
 */
export type OperationMetadata<TOptions extends OperationOptions = OperationOptions> = TOptions & {
    /** {@link OperationKind} identifying whether this is an Action or Query. */
    kind: OperationKind;
    /** Decorated {@link ActionMethod} implementing the operation. */
    method: ActionMethod;
    /** Name used to identify the operation. */
    name: string;
};
