import type { EntityRef, PaginatedList } from '@poseidon/utilities';

const relationshipPath = Symbol('relationship-path');

/** A proxy-backed path to a relationship property. */
export type RelationshipPath = {
    readonly [relationshipPath]: readonly string[];
};

/** Mirrors nested structures while exposing relationship properties as paths. */
export type RelationshipSelector<T> = {
    readonly [K in keyof T]: T[K] extends EntityRef<infer _Target>
        ? RelationshipPath
        : T[K] extends PaginatedList<infer _Item>
          ? RelationshipPath
          : T[K] extends object
            ? RelationshipSelector<T[K]>
            : never;
};

export type RelationshipMetadata = {
    target: () => RelationshipEntityClass;
    inversePath: string[];
};

export type RelationshipEntityClass = abstract new (...args: never[]) => object;

type RelationshipDefinition = {
    targetEntityType: { _id: string };
    inverseProperty: { _id: string };
    inversePath: string[];
};
type EntityTypeOptions = { name: string; structure?: boolean };
type PropertyMetadata = { itemsType?: unknown };
type RelationshipEndpoint = { owner: RelationshipEntityClass; name: string };

type RelationshipMetadataResolver = {
    entityTypeOptionsOf: (entityClass: RelationshipEntityClass) => EntityTypeOptions;
    propertiesOf: (prototype: object) => Map<string, PropertyMetadata>;
    relationshipsOf: (prototype: object) => Map<string, RelationshipMetadata>;
};

/** Captures the field path selected from a metadata proxy. */
export function captureRelationshipPath<T>(
    selector: (selector: RelationshipSelector<T>) => RelationshipPath,
): string[] {
    return [...selector(pathProxy([]))[relationshipPath]];
}

export function resolveRelationshipDefinition(
    entityClass: RelationshipEntityClass,
    propertyName: string,
    relationship: RelationshipMetadata,
    resolver: RelationshipMetadataResolver,
): RelationshipDefinition {
    const target = relationship.target();
    const targetOptions = resolver.entityTypeOptionsOf(target);
    if (targetOptions.structure === true) {
        throw new Error(
            `Relationship '${propertyName}' must target an entity type, not a structure.`,
        );
    }
    const inverse = relationshipEndpointOf(target, relationship.inversePath, resolver.propertiesOf);
    const inverseRelationship = resolver.relationshipsOf(inverse.owner.prototype).get(inverse.name);
    if (!inverseRelationship) {
        throw new Error(
            `Relationship '${propertyName}' must select a reciprocal relationship property.`,
        );
    }
    if (inverseRelationship.target() !== entityClass) {
        throw new Error(`Relationship '${propertyName}' must be reciprocal.`);
    }
    const expected = relationshipEndpointOf(
        entityClass,
        inverseRelationship.inversePath,
        resolver.propertiesOf,
    );
    if (expected.owner !== entityClass || expected.name !== propertyName) {
        throw new Error(
            `Relationship '${propertyName}' must be selected by its reciprocal property.`,
        );
    }
    return {
        targetEntityType: { _id: targetOptions.name },
        inverseProperty: {
            _id: `${resolver.entityTypeOptionsOf(inverse.owner).name}:${inverse.name}`,
        },
        inversePath: relationship.inversePath,
    };
}

function relationshipEndpointOf(
    entityClass: RelationshipEntityClass,
    path: string[],
    propertiesOf: (prototype: object) => Map<string, PropertyMetadata>,
): RelationshipEndpoint {
    if (path.length === 0) throw new Error('Relationship inverse paths cannot be empty.');
    let owner = entityClass;
    for (const propertyName of path.slice(0, -1)) {
        const property = propertiesOf(owner.prototype).get(propertyName);
        if (!property || typeof property.itemsType !== 'function') {
            throw new Error(
                `Relationship inverse path '${path.join('.')}' is not a declared nested property.`,
            );
        }
        owner = property.itemsType as RelationshipEntityClass;
    }
    const name = path.at(-1)!;
    if (!propertiesOf(owner.prototype).has(name)) {
        throw new Error(`Relationship inverse path '${path.join('.')}' is not declared.`);
    }
    return { owner, name };
}

function pathProxy(path: string[]): RelationshipSelector<never> {
    return new Proxy(Object.create(null), {
        get(_target, key) {
            if (key === relationshipPath) return path;
            if (typeof key !== 'string') {
                throw new Error('Relationship paths require string property names.');
            }
            return pathProxy([...path, key]);
        },
    }) as RelationshipSelector<never>;
}
