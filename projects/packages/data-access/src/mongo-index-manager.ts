import type { Entity, EntityData, EntityType, IndexDefinitionData } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

/** Realizes declarative indexes on the corresponding entity type collection. */
export class MongoIndexManager {
    public constructor(private readonly client: MongoClient) {}

    public async reconcile(): Promise<void> {
        const indexes = await this.client
            .db()
            .collection<Entity>('index')
            .find({ _deletedAt: { $exists: false } })
            .toArray();

        await Promise.all(indexes.map((index) => this.apply(index)));
    }

    public async apply(data: EntityData): Promise<void> {
        const definition = parseIndexDefinition(data);
        const entityType = await this.client
            .db()
            .collection<EntityType>('entity-type')
            .findOne({ _id: definition.entityTypeId });
        if (typeof entityType?.name !== 'string') {
            throw new Error(`Index '${definition.name}' references a missing entity type.`);
        }
        if (entityType.structure) {
            throw new Error(`Structure '${entityType.name}' cannot have collection indexes.`);
        }
        const namesById = new Map(
            entityType.properties.map((property) => [property._id, property.name]),
        );
        const propertyNames = definition.propertyIds.map((id) => namesById.get(id));
        if (propertyNames.some((name) => typeof name !== 'string')) {
            throw new Error(`Index '${definition.name}' references a missing property.`);
        }

        await this.client
            .db()
            .collection(entityType.name)
            .createIndex(Object.fromEntries(propertyNames.map((name) => [name, 1])), {
                name: `poseidon__${definition.name}`,
                unique: definition.unique,
            });
    }
}

function parseIndexDefinition(data: EntityData): IndexDefinitionData {
    if (
        typeof data.entityTypeId !== 'string' ||
        typeof data.name !== 'string' ||
        !Array.isArray(data.propertyIds) ||
        !data.propertyIds.every((id) => typeof id === 'string')
    ) {
        throw new Error('Index entity has an invalid definition.');
    }

    return {
        entityTypeId: data.entityTypeId,
        name: data.name,
        propertyIds: data.propertyIds,
        unique: data.unique === true,
    };
}
