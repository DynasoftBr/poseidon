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

export type DecoratorMetadata = Record<PropertyKey, unknown>;

export function requiredMetadata(metadata: DecoratorMetadata | undefined): DecoratorMetadata {
    if (!metadata) throw new Error('Standard decorator metadata is unavailable.');
    return metadata;
}

export function entityOptionsOf(metadata: DecoratorMetadata): EntityTypeOptions | undefined {
    return metadata[entityOptionsKey] as EntityTypeOptions | undefined;
}

export function setEntityOptions(metadata: DecoratorMetadata, options: EntityTypeOptions): void {
    metadata[entityOptionsKey] = options;
}

export function propertiesOf(metadata: DecoratorMetadata): Map<string, PropertyOptions> {
    return mapOf(metadata, propertyOptionsKey);
}

export function relationshipsOf(
    metadata: DecoratorMetadata,
): Map<string, DecoratedRelationshipMetadata> {
    return mapOf(metadata, relationshipOptionsKey);
}

export function actionsOf(metadata: DecoratorMetadata): Map<string, OperationMetadata> {
    return mapOf(metadata, actionOptionsKey);
}

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
