import type { EntityData } from '@poseidon/model';
import type { Connection } from 'mongoose';

/** Realizes declarative Index entities on Poseidon's shared MongoDB projection collection. */
export class MongoIndexManager {
    public constructor(private readonly connection: Connection) {}

    public async reconcile(): Promise<void> {
        const indexes = await this.connection
            .collection<StoredProjection>('entities')
            .find({ entityTypeId: 'index', deletedAt: { $exists: false } })
            .toArray();

        await Promise.all(indexes.map((index) => this.apply(index.data)));
    }

    public async apply(data: EntityData): Promise<void> {
        const definition = parseIndexDefinition(data);
        const properties = await this.connection
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

        await this.connection.collection('entities').createIndex(
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

interface StoredProjection {
    _id: string;
    entityTypeId: string;
    data: Record<string, unknown>;
}

interface ParsedIndexDefinition {
    entityTypeId: string;
    name: string;
    propertyIds: string[];
    unique: boolean;
}

function parseIndexDefinition(data: EntityData): ParsedIndexDefinition {
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
