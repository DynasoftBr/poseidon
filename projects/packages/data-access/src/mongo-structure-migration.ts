import type { Entity, EntityProperty } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

export class MongoStructureMigration {
    public constructor(private readonly client: MongoClient) {}

    public async migrate(): Promise<void> {
        const database = this.client.db();
        const collections = await database.listCollections({ name: 'entity-property' }).toArray();
        if (collections.length === 0) return;
        const legacy = database.collection<Entity>('entity-property');
        const definitions = new Map(
            (await legacy.find().toArray()).map((field) => [field._id, field]),
        );
        const types = database.collection<Entity>('entity-type');
        const updates = (await types.find().toArray()).map((entityType) => {
            const properties = (entityType.properties as (string | EntityProperty)[]).map(
                (field) => {
                    if (typeof field !== 'string') return field;
                    const definition = definitions.get(field);
                    if (!definition) {
                        throw new Error(
                            `Property '${field}' is missing during structure migration.`,
                        );
                    }
                    return embeddedProperty(definition);
                },
            );
            return { entityType, properties: migrateDefinition(entityType._id, properties) };
        });
        const session = this.client.startSession();
        try {
            await session.withTransaction(async () => {
                for (const { entityType, properties } of updates) {
                    await types.updateOne(
                        { _id: entityType._id },
                        {
                            $set: {
                                properties,
                                ...(entityType._id === 'entity-property'
                                    ? { structure: true }
                                    : {}),
                            },
                        },
                        { session },
                    );
                }
            });
        } finally {
            await session.endSession();
        }
        await legacy.drop();
    }
}

function embeddedProperty(entity: Entity): EntityProperty {
    const {
        _entityTypeId,
        _version,
        _createdAt,
        _createdBy,
        _changedAt,
        _changedBy,
        _deletedAt,
        _deletedBy,
        ...property
    } = entity;
    return property as unknown as EntityProperty;
}

function migrateDefinition(id: string, properties: EntityProperty[]): EntityProperty[] {
    if (id === 'entity-property') {
        return properties
            .filter((field) => !field.name.startsWith('_') || field.name === '_id')
            .map((field) => {
                if (field.name !== 'reversePropertyId') return field;
                const { relatedEntityTypeId: _related, ...rest } = field;
                return { ...rest, type: 'string' };
            });
    }
    if (id !== 'entity-type') return properties;
    const migrated = properties.map((field): EntityProperty =>
        field.name === 'properties' ? { ...field, itemsType: 'object' } : field,
    );
    if (!migrated.some((field) => field.name === 'structure')) {
        migrated.push({
            _id: 'entity-type:structure',
            entityTypeId: id,
            name: 'structure',
            type: 'boolean',
            default: false,
            required: false,
        });
    }
    return migrated;
}
