import type { Entity } from '@poseidon/models';
import type { MongoClient } from 'mongodb';
import type { DataStorage } from './data-storage';

export class MongoDataStorage implements DataStorage {
    public constructor(private readonly client: MongoClient) {}

    public async getById(entityTypeName: string, id: string): Promise<Entity | null> {
        return await this.client.db().collection<Entity>(entityTypeName).findOne({ _id: id });
    }

    public async create(entityTypeName: string, entity: Entity): Promise<void> {
        await this.client.db().collection<Entity>(entityTypeName).insertOne(entity);
    }

    public async update(entityTypeName: string, entity: Entity): Promise<void> {
        const result = await this.client
            .db()
            .collection<Entity>(entityTypeName)
            .replaceOne({ _id: entity._id, _version: entity._version - 1 }, entity);
        if (result.matchedCount !== 1) throw new Error(`Entity '${entity._id}' version mismatch.`);
    }

    public async delete(entityTypeName: string, id: string): Promise<void> {
        const result = await this.client
            .db()
            .collection<Entity>(entityTypeName)
            .deleteOne({ _id: id });
        if (result.deletedCount !== 1) throw new Error(`Entity '${id}' does not exist.`);
    }
}
