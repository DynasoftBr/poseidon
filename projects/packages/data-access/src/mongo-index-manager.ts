import type { Entity, EntityData, IndexDefinitionData } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

/** Realizes declarative Index entities on Poseidon's shared MongoDB projection collection. */
export class MongoIndexManager {
    public constructor(private readonly client: MongoClient) {}

    public async reconcile(): Promise<void> {
        const indexes = await this.client
            .db()
            .collection<Entity>('entities')
            .find({ _entityTypeId: 'index', _deletedAt: { $exists: false } })
            .toArray();

        await Promise.all(indexes.map((index) => this.apply(index)));
    }

    public async apply(data: EntityData): Promise<void> {
        const definition = parseIndexDefinition(data);
        const properties = await this.client
            .db()
            .collection<Entity>('entities')
            .find({ _id: { $in: definition.propertyIds }, _entityTypeId: 'entity-property' })
            .toArray();
        const namesById = new Map(
            properties.map((property) => [property._id, property.name] as const),
        );
        const propertyNames = definition.propertyIds.map((id) => namesById.get(id));

        if (propertyNames.some((name) => typeof name !== 'string')) {
            throw new Error(`Index '${definition.name}' references a missing property.`);
        }

        await this.client
            .db()
            .collection('entities')
            .createIndex(
                {
                    _entityTypeId: 1,
                    ...Object.fromEntries(propertyNames.map((name) => [name, 1])),
                },
                {
                    name: `poseidon__${definition.name}`,
                    unique: definition.unique,
                    partialFilterExpression: {
                        _entityTypeId: definition.entityTypeId,
                    },
                },
            );
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
