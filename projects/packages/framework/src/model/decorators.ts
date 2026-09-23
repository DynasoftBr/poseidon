import type { PoseidonAction } from '../entity-types/poseidon-action';
import type { PoseidonQuery } from '../entity-types/poseidon-query';
import type { EntityType } from '../entity-types/entity-type';
import type { EntityProperty, PropertyType } from '../entity-types/entity-property';
import type { EntityTypeDefinition } from './entity-type-definition';

/**
 * A class used to collect decorator metadata without instantiation.
 */
export type EntityClass = abstract new (...args: never[]) => object;

/**
 * Name defaults to kebab-case; label defaults to the class name. Structure marks an embedded type.
 */
export type EntityTypeOptions = Partial<
    Pick<EntityType, 'name' | 'label' | 'description' | 'structure'>
>;

/**
 * Explicit property type and constraints; the decorated member supplies its name.
 */
export type PropertyOptions = Omit<EntityProperty, 'name' | 'itemsType'> & {
    itemsType?: PropertyType | EntityClass;
};

export type ActionMethod = (...args: never[]) => unknown;
export type ActionOptions = {
    description: string;
    name?: string;
    before?: () => readonly ActionMethod[];
};
export type QueryOptions = { description: string; name?: string };

const entityOptions = new WeakMap<object, EntityTypeOptions>();
const propertyOptions = new WeakMap<object, Map<string, PropertyOptions>>();
type ActionMetadata = ActionOptions & { method: ActionMethod; name: string };
type QueryMetadata = QueryOptions & { method: ActionMethod; name: string };

const actionOptions = new WeakMap<object, Map<string, ActionMetadata>>();
const actionMethods = new WeakMap<ActionMethod, ActionMetadata>();
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
 * Declares a method as an action; the method forwards execution to Poseidon.
 * @param {ActionOptions} [options={}] - Decorated actions to run first.
 * @returns {MethodDecorator} A method decorator that records action metadata.
 * @throws If the method name is a symbol.
 */
export function Action(options: ActionOptions): MethodDecorator {
    return (target, key, descriptor) => {
        if (typeof key !== 'string') throw new Error('Action methods must have string names.');
        if (typeof descriptor.value !== 'function') {
            throw new Error('Actions must decorate methods.');
        }
        const owner = typeof target === 'function' ? target : target.constructor;
        const method = descriptor.value as ActionMethod;
        const metadata = { ...options, method, name: options.name ?? key };
        const actions = actionOptions.get(owner) ?? new Map<string, ActionMetadata>();
        actions.set(metadata.name, metadata);
        actionOptions.set(owner, actions);
        actionMethods.set(method, metadata);
    };
}

/**
 * Declares a method as a query.
 * @returns {MethodDecorator} A method decorator that records query metadata.
 * @throws If the method name is a symbol or the decorated value is not a method.
 */
export function Query(options: QueryOptions): MethodDecorator {
    return (target, key, descriptor) => {
        if (typeof key !== 'string') throw new Error('Queries must have string names.');
        if (typeof descriptor.value !== 'function') {
            throw new Error('Queries must decorate methods.');
        }
        const owner = typeof target === 'function' ? target : target.constructor;
        const queries = queryOptions.get(owner) ?? new Map<string, QueryMetadata>();
        const metadata = {
            ...options,
            method: descriptor.value as ActionMethod,
            name: options.name ?? key,
        };
        queries.set(metadata.name, metadata);
        queryOptions.set(owner, queries);
    };
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

function actionDefinition(action: ActionMetadata): PoseidonAction {
    return {
        id: action.name,
        name: action.name,
        label: action.name,
        description: action.description,
        enabled: true,
        before: (action.before?.() ?? []).map((method) => {
            const metadata = actionMethods.get(method);
            if (!metadata) {
                throw new Error('Before actions must reference methods decorated with @Action().');
            }
            return actionDefinition(metadata);
        }),
    };
}

function queryDefinition(query: QueryMetadata): PoseidonQuery {
    return {
        id: query.name,
        name: query.name,
        label: query.name,
        description: query.description,
        enabled: true,
    };
}

function actionsOf(entityClass: EntityClass): PoseidonAction[] {
    const parent = Object.getPrototypeOf(entityClass) as EntityClass | null;
    const actions = new Map(
        parent && parent !== Function.prototype
            ? actionsOf(parent).map((action) => [action.name, action])
            : [],
    );
    for (const [, action] of actionOptions.get(entityClass) ?? []) {
        actions.set(action.name, actionDefinition(action));
    }
    return [...actions.values()];
}

function queriesOf(entityClass: EntityClass): PoseidonQuery[] {
    const parent = Object.getPrototypeOf(entityClass) as EntityClass | null;
    const queries = new Map(
        parent && parent !== Function.prototype
            ? queriesOf(parent).map((query) => [query.name, query])
            : [],
    );
    for (const [, query] of queryOptions.get(entityClass) ?? []) {
        queries.set(query.name, queryDefinition(query));
    }
    return [...queries.values()];
}

/**
 * Collects inherited properties, preferring subclass declarations.
 * @param {object} prototype - Prototype to inspect.
 * @returns {Map<string, PropertyOptions>} Property metadata keyed by member name.
 */
function propertiesOf(prototype: object): Map<string, PropertyOptions> {
    const parent: object | null = Object.getPrototypeOf(prototype);
    const properties = parent ? propertiesOf(parent) : new Map<string, PropertyOptions>();

    for (const [name, options] of propertyOptions.get(prototype) ?? []) {
        properties.set(name, options);
    }

    return properties;
}

/**
 * Converts decorated members into an EntityType definition.
 * @param {EntityClass} entityClass - Decorated entity class.
 * @returns {EntityType} The entity definition with its property metadata.
 * @throws If the class lacks EntityType metadata.
 * @internal
 */
export function definitionOf(entityClass: EntityClass): EntityTypeDefinition {
    const options = optionsOf(entityClass);
    const name = options.name;
    const actions = actionsOf(entityClass);
    const queries = queriesOf(entityClass);

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
    const options = entityOptions.get(entityClass);
    if (!options) throw new Error(`${entityClass.name} must declare @EntityTypeDef().`);

    const name =
        options.name ??
        entityClass.name
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();

    return { ...options, name };
}
