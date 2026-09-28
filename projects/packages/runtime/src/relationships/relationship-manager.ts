import type { EntityPropertyDefinition, EntityTypeDefinition } from '@poseidon/framework';
import type { EntityRecord } from '../entity-types/entity-type-store';
import type {
    RelationshipEndpoint,
    RelationshipEndpointInput,
    RelationshipRecord,
    RelationshipStore,
} from './relationship-store';

type EntityReader = (entityTypeName: string, id: string) => Promise<EntityRecord>;
type EntityDeleter = (entityTypeName: string, id: string) => Promise<void>;

/** Keeps relationship values outside business-record documents. */
export class RelationshipManager {
    public constructor(
        private readonly store: RelationshipStore,
        private readonly getEntity: EntityReader,
        private readonly deleteEntity: EntityDeleter,
    ) {}

    public dataWithoutRelationships(
        entityType: EntityTypeDefinition,
        data: Record<string, unknown>,
    ): Record<string, unknown> {
        const relationshipNames = new Set(
            relationshipProperties(entityType).map(({ name }) => name),
        );
        return Object.fromEntries(
            Object.entries(data).filter(([name]) => !relationshipNames.has(name)),
        );
    }

    public async save(
        entityType: EntityTypeDefinition,
        entity: EntityRecord,
        data: Record<string, unknown>,
    ): Promise<void> {
        for (const property of relationshipProperties(entityType)) {
            const value = data[property.name];
            if (value === undefined) continue;
            const endpoint = endpointOf(property, entity._id);
            if (value === null) {
                await this.store.remove(endpoint);
                continue;
            }
            if (!isEntityReference(value)) {
                throw new Error(
                    `Relationship '${property.name}' must provide an entity reference.`,
                );
            }
            const targetEntityType = entityTypeIdOf(property);
            const inverse = await this.getEntity('entity-property', inversePropertyIdOf(property));
            const inverseProperty = inverse as EntityPropertyDefinition;
            await this.getEntity(targetEntityType, value._id);
            await this.store.replace(endpoint, endpointOf(inverseProperty, value._id));
        }
    }

    public async delete(entityType: EntityTypeDefinition, id: string): Promise<void> {
        const cascades: Array<{ entityTypeName: string; id: string }> = [];
        for (const property of relationshipProperties(entityType)) {
            const endpoint = endpointOf(property, id);
            const relationships = await this.store.find(endpoint);
            const onDelete = property.onDelete ?? 'restrict';
            if (onDelete === 'restrict' && relationships.length > 0) {
                throw new Error(`Relationship '${property.name}' prevents deleting '${id}'.`);
            }
            if (onDelete === 'cascade') {
                const targetEntityType = entityTypeIdOf(property);
                cascades.push(...relatedRecords(relationships, endpoint, targetEntityType));
            }
            await this.store.remove(endpoint);
        }
        for (const cascade of cascades) await this.deleteEntity(cascade.entityTypeName, cascade.id);
    }
}

function relationshipProperties(entityType: EntityTypeDefinition): EntityPropertyDefinition[] {
    return entityType.properties.filter(
        (property) => property.type === 'reference' && property.cardinality !== undefined,
    );
}

function endpointOf(
    property: EntityPropertyDefinition,
    entityId: string,
): RelationshipEndpointInput {
    if (!property._id) throw new Error(`Relationship '${property.name}' must have an identifier.`);
    if (!property.cardinality) {
        throw new Error(`Relationship '${property.name}' must declare cardinality.`);
    }
    return { entityPropertyId: property._id, entityId, cardinality: property.cardinality };
}

function entityTypeIdOf(property: EntityPropertyDefinition): string {
    const entityTypeId = property.targetEntityType?._id;
    if (!entityTypeId) {
        throw new Error(`Relationship '${property.name}' must declare a target entity type.`);
    }
    return entityTypeId;
}

function inversePropertyIdOf(property: EntityPropertyDefinition): string {
    const inversePropertyId = property.inverseProperty?._id;
    if (!inversePropertyId) {
        throw new Error(`Relationship '${property.name}' must declare an inverse property.`);
    }
    return inversePropertyId;
}

function isEntityReference(value: unknown): value is { _id: string } {
    return (
        typeof value === 'object' &&
        value !== null &&
        '_id' in value &&
        typeof value._id === 'string'
    );
}

function relatedRecords(
    relationships: RelationshipRecord[],
    endpoint: RelationshipEndpoint,
    entityTypeName: string,
): Array<{ entityTypeName: string; id: string }> {
    return relationships.map((relationship) => {
        const related = relationship.endpoints.find(
            (candidate) =>
                candidate.entityPropertyId !== endpoint.entityPropertyId ||
                candidate.entityId !== endpoint.entityId,
        );
        if (!related) throw new Error('Relationship records require two distinct endpoints.');
        return { entityTypeName, id: related.entityId };
    });
}
