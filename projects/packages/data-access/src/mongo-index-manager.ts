import type { Entity, EntityData, IndexDefinitionData } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

/** Realizes declarative Index entities on Poseidon's shared MongoDB projection collection. */
export class MongoIndexManager {
    public constructor(private readonly client: MongoClient) {}

    public async reconcile(): Promise<void> {
        const indexes = await this.client
            .db()
            .collection<StoredProjection>('entities')
            .find({ entityTypeId: 'index', deletedAt: { $exists: false } })
            .toArray();

        await Promise.all(indexes.map((index) => this.apply(index.data)));
    }

    public async apply(data: EntityData): Promise<void> {
        const definition = parseIndexDefinition(data);
        const properties = await this.client
            .db()
            .collection<StoredProjection>('entities')
            .find({ _id: { $in: definition.propertyIds }, entityTypeId: 'entity-property' })
            .toArray();
        const namesById = new Map(
            properties.map((property) => [property._id, property.data.name] as const),
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
                    entityTypeId: 1,
                    ...Object.fromEntries(propertyNames.map((name) => [`data.${name}`, 1])),
                },
                {
                    name: `poseidon__${definition.name}`,
                    unique: definition.unique,
                    partialFilterExpression: {
                        entityTypeId: definition.entityTypeId,
                    },
                },
            );
    }
}

type StoredProjection = Omit<Entity, 'id'> & { _id: string };

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
