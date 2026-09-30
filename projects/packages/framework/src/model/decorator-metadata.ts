import type {
    DecoratedRelationshipMetadata,
    EntityTypeOptions,
    OperationMetadata,
    PropertyOptions,
} from './decorator-types';

const symbolConstructor = Symbol as typeof Symbol & { metadata?: symbol };
export const decoratorMetadataSymbol =
    symbolConstructor.metadata ?? (symbolConstructor.metadata = Symbol('Symbol.metadata'));

const entityOptionsKey = Symbol('poseidon.entity-options');
const propertyOptionsKey = Symbol('poseidon.property-options');
const relationshipOptionsKey = Symbol('poseidon.relationship-options');
const actionOptionsKey = Symbol('poseidon.action-options');
const queryOptionsKey = Symbol('poseidon.query-options');

/** Metadata shared by standard decorators on an entity class. */
export type DecoratorMetadata = Record<PropertyKey, unknown>;

/**
 * Requires metadata support for a standard decorator.
 * @param {DecoratorMetadata | undefined} metadata - {@link DecoratorMetadata} for the class.
 * @returns {DecoratorMetadata} Available {@link DecoratorMetadata}.
 * @throws {@link Error} — If standard decorator metadata is unavailable.
 */
export function requiredMetadata(metadata: DecoratorMetadata | undefined): DecoratorMetadata {
    if (!metadata) throw new Error('Standard decorator metadata is unavailable.');
    return metadata;
}

/**
 * Reads the entity options stored in decorator metadata.
 * @param {DecoratorMetadata} metadata - {@link DecoratorMetadata} for the class.
 * @returns {EntityTypeOptions | undefined} {@link EntityTypeOptions}, or undefined when absent.
 */
export function entityOptionsOf(metadata: DecoratorMetadata): EntityTypeOptions | undefined {
    return metadata[entityOptionsKey] as EntityTypeOptions | undefined;
}

/**
 * Stores entity options in decorator metadata.
 * @param {DecoratorMetadata} metadata - {@link DecoratorMetadata} for the class.
 * @param {EntityTypeOptions} options - {@link EntityTypeOptions} to register.
 */
export function setEntityOptions(metadata: DecoratorMetadata, options: EntityTypeOptions): void {
    metadata[entityOptionsKey] = options;
}

/**
 * Gets the class property metadata, copying inherited entries on first access.
 * @param {DecoratorMetadata} metadata - {@link DecoratorMetadata} for the class.
 * @returns {Map<string, PropertyOptions>} Writable map of {@link PropertyOptions} for this class.
 */
export function propertiesOf(metadata: DecoratorMetadata): Map<string, PropertyOptions> {
    return mapOf(metadata, propertyOptionsKey);
}

/**
 * Gets the class relationship metadata, copying inherited entries on first access.
 * @param {DecoratorMetadata} metadata - {@link DecoratorMetadata} for the class.
 * @returns {Map<string, DecoratedRelationshipMetadata>} Writable map of {@link DecoratedRelationshipMetadata} for this class.
 */
export function relationshipsOf(
    metadata: DecoratorMetadata,
): Map<string, DecoratedRelationshipMetadata> {
    return mapOf(metadata, relationshipOptionsKey);
}

/**
 * Gets the class Action metadata, copying inherited entries on first access.
 * @param {DecoratorMetadata} metadata - {@link DecoratorMetadata} for the class.
 * @returns {Map<string, OperationMetadata>} Writable map of {@link OperationMetadata} for this class.
 */
export function actionsOf(metadata: DecoratorMetadata): Map<string, OperationMetadata> {
    return mapOf(metadata, actionOptionsKey);
}

/**
 * Gets the class Query metadata, copying inherited entries on first access.
 * @param {DecoratorMetadata} metadata - {@link DecoratorMetadata} for the class.
 * @returns {Map<string, OperationMetadata>} Writable map of {@link OperationMetadata} for this class.
 */
export function queriesOf(metadata: DecoratorMetadata): Map<string, OperationMetadata> {
    return mapOf(metadata, queryOptionsKey);
}

function mapOf<T>(metadata: DecoratorMetadata, key: symbol): Map<string, T> {
    if (Object.hasOwn(metadata, key)) {
        return metadata[key] as Map<string, T>;
    }

    const inherited = metadata[key] as Map<string, T> | undefined;
    const copy = new Map(inherited);
    metadata[key] = copy;
    return copy;
}
