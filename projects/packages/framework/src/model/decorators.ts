import type { Operation } from '../entity-types/operation';
import type { EntityType } from '../entity-types/entity-type';
import type {
    EntityProperty,
    OnDeleteBehavior,
    PropertyType,
    RelationshipCardinality,
} from '../entity-types/entity-property';
import {
    captureRelationshipPath,
    resolveRelationshipDefinition,
    type RelationshipMetadata,
    type RelationshipPath,
    type RelationshipSelector,
} from './relationship-metadata';
import type {
    ActionDefinition,
    EntityTypeDefinition,
    QueryDefinition,
} from './entity-type-definition';
import { poseidon } from '../poseidon';

/**
 * A class used to collect decorator metadata without instantiation.
 */
export type EntityClass<T = object> = abstract new (...args: never[]) => T;

/**
 * Name defaults to kebab-case; label defaults to the class name. Structure marks an embedded type.
 */
export type EntityTypeOptions = Partial<
    Pick<EntityType, 'name' | 'label' | 'description' | 'structure'>
>;

/**
 * Explicit property type and constraints; the decorated member supplies its name.
 */
export type PropertyOptions = Omit<EntityProperty, '_id' | '_version' | 'name' | 'itemsType'> & {
    itemsType?: PropertyType | EntityClass;
};

export type ActionMethod = (...args: never[]) => Promise<unknown>;
type OperationOptions = {
    description: string;
    name?: string;
    permissions: string[];
};
export type ActionOptions = OperationOptions;
export type QueryOptions = OperationOptions;

export type ReferencesOptions = {
    cardinality: RelationshipCardinality;
    onDelete?: OnDeleteBehavior;
};
type DecoratedRelationshipMetadata = ReferencesOptions & RelationshipMetadata;

const entityOptions = new WeakMap<object, EntityTypeOptions>();
const propertyOptions = new WeakMap<object, Map<string, PropertyOptions>>();
const relationshipOptions = new WeakMap<object, Map<string, DecoratedRelationshipMetadata>>();
type OperationMetadata<TOptions extends OperationOptions> = TOptions & {
    method: ActionMethod;
    name: string;
};
type ActionMetadata = OperationMetadata<ActionOptions>;
type QueryMetadata = OperationMetadata<QueryOptions>;

const actionOptions = new WeakMap<object, Map<string, ActionMetadata>>();
const queryOptions = new WeakMap<object, Map<string, QueryMetadata>>();

/**
 * Declares an entity class. Requires `experimentalDecorators: true`.
 * Each registered class needs its own decorator.
 * @param {EntityTypeOptions} [options={}] - Entity name, label, description, and structure settings.
 * @returns {ClassDecorator} A class decorator that records the definition metadata.
 */
export function EntityTypeDef(options: EntityTypeOptions = {}): ClassDecorator {
    return (target) => {
        entityOptions.set(target, options);
    };
}

/**
 * Declares a string-named instance property with an explicit type.
 * Subclass declarations override inherited property metadata.
 * @param {PropertyOptions} options - Property type, description, constraints, and defaults.
 * @returns {PropertyDecorator} An instance-property decorator.
 * @throws When decorating a static or symbol-named property.
 */
export function Property(options: PropertyOptions): PropertyDecorator {
    return (target, key) => {
        if (typeof target === 'function' || typeof key !== 'string') {
            throw new Error('Entity properties must be named instance properties.');
        }

        const properties = propertyOptions.get(target) ?? new Map<string, PropertyOptions>();
        properties.set(key, options);
        propertyOptions.set(target, properties);
    };
}

/**
 * Declares a reciprocal relationship property.
 * @param {() => EntityClass} target - Entity type at the opposite endpoint.
 * @param {(selector: RelationshipSelector<TTarget>) => unknown} inverse - Reciprocal property selector.
 * @param {ReferencesOptions} options - Relationship cardinality and deletion behavior.
 * @returns {PropertyDecorator} A relationship-property decorator.
 */
export function References<TTarget extends object>(
    target: () => EntityClass<TTarget>,
    inverse: (selector: RelationshipSelector<TTarget>) => RelationshipPath,
    options: ReferencesOptions,
): PropertyDecorator {
    return (owner, key) => {
        if (typeof owner === 'function' || typeof key !== 'string') {
            throw new Error('Relationship properties must be named instance properties.');
        }
        const onDelete = options.onDelete ?? 'restrict';
        Property({ type: 'reference', cardinality: options.cardinality, onDelete })(owner, key);
        const relationships =
            relationshipOptions.get(owner) ?? new Map<string, DecoratedRelationshipMetadata>();
        relationships.set(key, {
            ...options,
            onDelete,
            target,
            inversePath: captureRelationshipPath(inverse),
        });
        relationshipOptions.set(owner, relationships);
    };
}

/**
 * Declares a method as an action; the method forwards execution to Poseidon.
 * @param {ActionOptions} options - Action description, permissions, and optional API name.
 * @returns {MethodDecorator} A method decorator that records action metadata.
 * @throws If the method name is a symbol.
 */
export function Action(options: ActionOptions) {
    return operationDecorator(options, actionOptions, 'Action', operationWrapper);
}

/**
 * Declares a method as a query.
 * @returns {MethodDecorator} A method decorator that records query metadata.
 * @throws If the method name is a symbol or the decorated value is not a method.
 */
export function Query(options: QueryOptions) {
    return operationDecorator(options, queryOptions, 'Query', operationWrapper);
}

/**
 * Resolves a decorated operation method by its declared operation name.
 * @param {EntityClass} entityClass - Decorated class containing the operation.
 * @param {string} name - Declared operation name.
 * @returns {ActionMethod | undefined} The operation method, or undefined when absent.
 * @internal
 */
export function operationMethodOf(
    entityClass: EntityClass,
    name: string,
): ActionMethod | undefined {
    return (
        actionOptions.get(entityClass)?.get(name)?.method ??
        queryOptions.get(entityClass)?.get(name)?.method
    );
}

function operationDecorator<TOptions extends OperationOptions>(
    options: TOptions,
    metadataByOwner: WeakMap<object, Map<string, OperationMetadata<TOptions>>>,
    operation: string,
    wrap: (metadata: OperationMetadata<TOptions>) => ActionMethod,
) {
    return <TMethod extends ActionMethod>(
        target: object,
        key: string | symbol,
        descriptor: TypedPropertyDescriptor<TMethod>,
    ): void => {
        if (typeof key !== 'string') {
            throw new Error(`${operation} methods must have string names.`);
        }
        const method = descriptor.value;
        if (typeof method !== 'function') {
            throw new Error(`${operation}s must decorate methods.`);
        }

        const owner = typeof target === 'function' ? target : target.constructor;
        const metadata = { ...options, method, name: options.name ?? key };
        const operations = metadataByOwner.get(owner) ?? new Map<string, typeof metadata>();
        operations.set(metadata.name, metadata);
        metadataByOwner.set(owner, operations);
        descriptor.value = wrap(metadata) as TMethod;
    };
}

function operationWrapper(metadata: OperationMetadata<OperationOptions>): ActionMethod {
    return function (this: object, payload: object): Promise<unknown> {
        const entityClass = (typeof this === 'function' ? this : this.constructor) as EntityClass;
        return poseidon.context().execute({
            entityType: entityTypeNameOf(entityClass),
            action: metadata.name,
            payload,
        });
    };
}

function operationDefinition(
    entityTypeName: string,
    operation: OperationMetadata<OperationOptions>,
): Omit<Operation, '_version'> {
    return {
        _id: `${entityTypeName}:${operation.name}`,
        name: operation.name,
        label: operation.name,
        description: operation.description,
        permissions: operation.permissions,
        enabled: true,
    };
}

function actionDefinition(entityTypeName: string, action: ActionMetadata): ActionDefinition {
    return operationDefinition(entityTypeName, action);
}

function queryDefinition(entityTypeName: string, query: QueryMetadata): QueryDefinition {
    return operationDefinition(entityTypeName, query);
}

function operationsOf<TMetadata extends { name: string }, TOperation extends { name: string }>(
    entityClass: EntityClass,
    metadataByOwner: WeakMap<object, Map<string, TMetadata>>,
    definitionOf: (entityTypeName: string, metadata: TMetadata) => TOperation,
): TOperation[] {
    const entityTypeName = optionsOf(entityClass).name;
    return [...operationMetadataOf(entityClass, metadataByOwner).values()].map((metadata) =>
        definitionOf(entityTypeName, metadata),
    );
}

function operationMetadataOf<TMetadata extends { name: string }>(
    entityClass: EntityClass,
    metadataByOwner: WeakMap<object, Map<string, TMetadata>>,
): Map<string, TMetadata> {
    const parent = Object.getPrototypeOf(entityClass) as EntityClass | null;
    const operations = new Map(
        parent && parent !== Function.prototype ? operationMetadataOf(parent, metadataByOwner) : [],
    );
    for (const [, metadata] of metadataByOwner.get(entityClass) ?? []) {
        operations.set(metadata.name, metadata);
    }
    return operations;
}

function propertiesOf(prototype: object): Map<string, PropertyOptions> {
    const parent: object | null = Object.getPrototypeOf(prototype);
    const properties = parent ? propertiesOf(parent) : new Map<string, PropertyOptions>();

    for (const [name, options] of propertyOptions.get(prototype) ?? []) {
        properties.set(name, options);
    }

    return properties;
}

function relationshipsOf(prototype: object): Map<string, DecoratedRelationshipMetadata> {
    const parent: object | null = Object.getPrototypeOf(prototype);
    const relationships = parent
        ? relationshipsOf(parent)
        : new Map<string, DecoratedRelationshipMetadata>();
    const ownRelationships =
        relationshipOptions.get(prototype) ?? new Map<string, DecoratedRelationshipMetadata>();
    for (const name of propertyOptions.get(prototype)?.keys() ?? []) {
        const relationship = ownRelationships.get(name);
        if (relationship) relationships.set(name, relationship);
        else relationships.delete(name);
    }
    return relationships;
}

export function definitionOf(entityClass: EntityClass): EntityTypeDefinition {
    const options = optionsOf(entityClass);
    const name = options.name;
    const actions = operationsOf(entityClass, actionOptions, actionDefinition);
    const queries = operationsOf(entityClass, queryOptions, queryDefinition);
    const relationships = relationshipsOf(entityClass.prototype);

    return {
        _id: name,
        name,
        label: options.label ?? entityClass.name,
        ...(options.description === undefined ? {} : { description: options.description }),
        ...(options.structure === undefined ? {} : { structure: options.structure }),
        properties: [...propertiesOf(entityClass.prototype)].map(
            ([propertyName, { itemsType, ...property }]) => ({
                ...property,
                ...(itemsType === undefined
                    ? {}
                    : {
                          itemsType:
                              typeof itemsType === 'function'
                                  ? optionsOf(itemsType).name
                                  : itemsType,
                      }),
                ...(relationships.has(propertyName)
                    ? resolveRelationshipDefinition(
                          entityClass,
                          propertyName,
                          relationships.get(propertyName)!,
                          {
                              entityTypeOptionsOf: optionsOf,
                              propertiesOf,
                              relationshipsOf,
                          },
                      )
                    : {}),
                _id: `${name}:${propertyName}`,
                name: propertyName,
            }),
        ),
        ...(actions.length === 0 ? {} : { actions }),
        ...(queries.length === 0 ? {} : { queries }),
    };
}

/**
 * Resolves the entity type name of an entity class.
 * @param {EntityClass} entityClass - Entity class to resolve.
 * @returns {string} The entity type name.
 * @throws If the class has neither a declared name nor EntityType metadata.
 * @internal
 */
export function entityTypeNameOf(entityClass: EntityClass): string {
    if ('entityTypeName' in entityClass && typeof entityClass.entityTypeName === 'string') {
        return entityClass.entityTypeName;
    }
    return optionsOf(entityClass).name;
}

/**
 * Resolves entity options and the name used as its ID.
 * @param {EntityClass} entityClass - Decorated entity class.
 * @returns {EntityTypeOptions & {name: string}} Options with a resolved name.
 * @throws If the class lacks EntityType metadata.
 */
function optionsOf(entityClass: EntityClass): EntityTypeOptions & { name: string } {
    const options =
        entityOptions.get(entityClass) ?? entityOptions.get(Object.getPrototypeOf(entityClass));
    if (!options) throw new Error(`${entityClass.name} must declare @EntityTypeDef().`);

    const name =
        options.name ??
        entityClass.name
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();

    return { ...options, name };
}
