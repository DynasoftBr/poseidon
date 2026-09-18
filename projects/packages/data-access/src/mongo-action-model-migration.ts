import { propertyTypes, type Entity } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

export class MongoActionModelMigration {
    public constructor(private readonly client: MongoClient) {}

    public async migrate(): Promise<void> {
        const types = this.client.db().collection<Entity>('entity-type');
        for (const entityType of await types.find().toArray()) {
            if (!Array.isArray(entityType.properties)) continue;
            const properties = entityType.properties
                .filter(
                    (field: Record<string, unknown>) =>
                        entityType.name !== 'entity-property' ||
                        !['relationKind', 'reversePropertyId'].includes(String(field.name)),
                )
                .map((field: Record<string, unknown>) =>
                    migrateProperty(field, String(entityType.name)),
                );
            if (JSON.stringify(properties) === JSON.stringify(entityType.properties)) continue;
            await types.updateOne(
                { _id: entityType._id, _version: entityType._version },
                { $set: { properties, _version: entityType._version + 1 } },
            );
        }
    }
}

function migrateProperty(
    field: Record<string, unknown>,
    entityTypeName: string,
): Record<string, unknown> {
    const { relationKind: _relation, reversePropertyId: _reverse, ...value } = field;
    if (value.type === 'reference') value.type = 'string';
    if (value.itemsType === 'reference') value.itemsType = 'string';
    if (value.type !== 'object' && !(value.type === 'array' && value.itemsType === 'object')) {
        delete value.relatedEntityTypeId;
    }
    if (
        entityTypeName === 'entity-property' &&
        ['type', 'itemsType'].includes(String(value.name))
    ) {
        value.enum = [...propertyTypes];
    }
    if (entityTypeName === 'identity' && ['members', 'memberOf'].includes(String(value.name))) {
        value.required = false;
    }
    return value;
}
