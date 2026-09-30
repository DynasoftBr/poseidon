import type { Operation } from '../entity-types/operation';
import type { OperationReference } from '../entity-types/operation-reference';
import type {
    ActionDefinition,
    EntityTypeDefinition,
    QueryDefinition,
} from './entity-type-definition';
import {
    actionsOf,
    decoratorMetadataSymbol,
    entityOptionsOf,
    propertiesOf,
    queriesOf,
    relationshipsOf,
} from './decorator-metadata';
import type {
    ActionMethod,
    EntityClass,
    EntityTypeOptions,
    OperationMetadata,
    PropertyOptions,
} from './decorator-types';
import { resolveRelationshipDefinition } from './relationship-metadata';
import { operationAddress } from './operation-address';
import { operationMetadataOf } from './operation-decorator';

/**
 * Builds an EntityType definition from a decorated class and its inherited metadata.
 * @param {EntityClass} entityClass - Decorated {@link EntityClass} to inspect.
 * @returns {EntityTypeDefinition} Resolved {@link EntityTypeDefinition} including inherited members.
 */
export function definitionOf(entityClass: EntityClass): EntityTypeDefinition {
    const options = optionsOf(entityClass);
    const name = options.name;
    const relationships = relationshipsFor(entityClass);
    const properties = propertiesFor(entityClass);
    const actions = operationDefinitions(name, actionsFor(entityClass));
    const queries = operationDefinitions(name, queriesFor(entityClass));

    return {
        _id: name,
        name,
        label: options.label ?? entityClass.name,
        ...(options.description === undefined ? {} : { description: options.description }),
        ...(options.structure === undefined ? {} : { structure: options.structure }),
        properties: [...properties].map(([propertyName, { itemsType, ...property }]) => ({
            ...property,
            ...(itemsType === undefined
                ? {}
                : {
                      itemsType:
                          typeof itemsType === 'function' ? optionsOf(itemsType).name : itemsType,
                  }),
            ...(relationships.has(propertyName)
                ? resolveRelationshipDefinition(
                      entityClass,
                      propertyName,
                      relationships.get(propertyName)!,
                      {
                          entityTypeOptionsOf: optionsOf,
                          propertiesOf: (prototype) =>
                              propertiesForClass(prototype.constructor as EntityClass),
                          relationshipsOf: (prototype) =>
                              relationshipsFor(prototype.constructor as EntityClass),
                      },
                  )
                : {}),
            _id: `${name}:${propertyName}`,
            name: propertyName,
        })),
        ...(actions.length === 0 ? {} : { actions }),
        ...(queries.length === 0 ? {} : { queries }),
    };
}

/**
 * Finds an operation method declared or overridden by the entity class.
 * @param {EntityClass} entityClass - Decorated {@link EntityClass} to inspect.
 * @param {string} name - Name of the declared operation.
 * @returns {ActionMethod | undefined} Declared {@link ActionMethod}, or undefined when no own declaration exists.
 */
export function operationMethodOf(
    entityClass: EntityClass,
    name: string,
): ActionMethod | undefined {
    return (
        ownOperationOf(entityClass, name, actionsFor)?.method ??
        ownOperationOf(entityClass, name, queriesFor)?.method
    );
}

/**
 * Resolves the explicit or convention-based name of an entity class.
 * @param {EntityClass} entityClass - Decorated {@link EntityClass} to inspect.
 * @returns {string} Resolved entity type name.
 */
export function entityTypeNameOf(entityClass: EntityClass): string {
    if ('entityTypeName' in entityClass && typeof entityClass.entityTypeName === 'string') {
        return entityClass.entityTypeName;
    }
    return optionsOf(entityClass).name;
}

function operationDefinitions(
    entityTypeName: string,
    operations: Map<string, OperationMetadata>,
): Array<ActionDefinition | QueryDefinition> {
    return [...operations.values()].map((operation) =>
        operationDefinition(entityTypeName, operation),
    );
}

function operationDefinition(
    entityTypeName: string,
    operation: OperationMetadata,
): Omit<Operation, '_version'> {
    return {
        _id: operationAddress(operation.kind, entityTypeName, operation.name),
        name: operation.name,
        label: operation.name,
        description: operation.description,
        permissions: operation
            .permissions()
            .map((permission) => permissionReference(entityTypeName, permission)),
        enabled: true,
    };
}

function permissionReference(entityTypeName: string, method: ActionMethod): OperationReference {
    const operation = operationMetadataOf(method);
    if (!operation) throw new Error('Operation permissions must reference decorated methods.');
    return {
        entityTypeId: entityTypeName,
        operationId: operationAddress(operation.kind, entityTypeName, operation.name),
    } as OperationReference;
}

function optionsOf(entityClass: EntityClass): EntityTypeOptions & {
    name: string;
} {
    const options = entityOptionsOf(metadataOf(entityClass));
    if (!options) throw new Error(`${entityClass.name} must declare @EntityTypeDef().`);

    const name =
        options.name ??
        entityClass.name
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .toLowerCase();

    return { ...options, name };
}

function propertiesFor(entityClass: EntityClass): Map<string, PropertyOptions> {
    return propertiesOf(metadataOf(entityClass));
}

function propertiesForClass(entityClass: EntityClass): Map<string, PropertyOptions> {
    return propertiesFor(entityClass);
}

function relationshipsFor(entityClass: EntityClass) {
    return relationshipsOf(metadataOf(entityClass));
}

function ownOperationOf(
    entityClass: EntityClass,
    name: string,
    operationsFor: (entityClass: EntityClass) => Map<string, OperationMetadata>,
): OperationMetadata | undefined {
    const operation = operationsFor(entityClass).get(name);
    const parent = Object.getPrototypeOf(entityClass) as EntityClass | null;
    const inherited =
        parent && parent !== Function.prototype ? operationsFor(parent).get(name) : undefined;
    return operation === inherited ? undefined : operation;
}

function actionsFor(entityClass: EntityClass): Map<string, OperationMetadata> {
    return actionsOf(metadataOrEmpty(entityClass));
}

function queriesFor(entityClass: EntityClass): Map<string, OperationMetadata> {
    return queriesOf(metadataOrEmpty(entityClass));
}

function metadataOrEmpty(entityClass: EntityClass): Record<PropertyKey, unknown> {
    const metadata = (entityClass as unknown as Record<PropertyKey, unknown>)[
        decoratorMetadataSymbol
    ];
    return metadata && typeof metadata === 'object'
        ? (metadata as Record<PropertyKey, unknown>)
        : {};
}

function metadataOf(entityClass: EntityClass): Record<PropertyKey, unknown> {
    const metadata = (entityClass as unknown as Record<PropertyKey, unknown>)[
        decoratorMetadataSymbol
    ];
    if (!metadata || typeof metadata !== 'object') {
        throw new Error(`${entityClass.name} must declare @EntityTypeDef().`);
    }
    return metadata as Record<PropertyKey, unknown>;
}
