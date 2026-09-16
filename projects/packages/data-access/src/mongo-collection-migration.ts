import { isDeepStrictEqual } from 'node:util';
import type { Entity } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

export class MongoCollectionMigration {
    public constructor(private readonly client: MongoClient) {}

    public async migrate(): Promise<void> {
        const database = this.client.db();
        const collections = await database.listCollections({ name: 'entities' }).toArray();
        if (collections.length === 0) return;

        const legacy = database.collection<Entity>('entities');
        const entityTypes = await legacy.find({ _entityTypeId: 'entity-type' }).toArray();
        const namesById = new Map(entityTypes.map((type) => [type._id, type.name]));

        for await (const entity of legacy.find()) {
            const name =
                entity._entityTypeId === 'entity-type'
                    ? 'entity-type'
                    : namesById.get(entity._entityTypeId);
            if (typeof name !== 'string') {
                throw new Error(`Cannot migrate entity '${entity._id}': entity type is missing.`);
            }
            const target = database.collection<Entity>(name);
            const existing = await target.findOne({ _id: entity._id });
            if (existing) {
                if (!isDeepStrictEqual(existing, entity)) {
                    throw new Error(
                        `Cannot migrate entity '${entity._id}': target differs from source.`,
                    );
                }
                continue;
            }
            await target.insertOne(entity);
        }

        await legacy.drop();
    }
}
