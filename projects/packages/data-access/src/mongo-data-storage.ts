import type { Entity } from '@poseidon/models';
import type { MongoClient } from 'mongodb';

export class MongoDataStorage {
    public constructor(private readonly client: MongoClient) {}

    public async getById(id: string): Promise<Entity | null> {
        return await this.client.db().collection<Entity>('entities').findOne({ _id: id });
    }

    public async create(entity: Entity): Promise<void> {
        await this.client.db().collection<Entity>('entities').insertOne(entity);
    }

    public async update(entity: Entity): Promise<void> {
        const result = await this.client
            .db()
            .collection<Entity>('entities')
            .replaceOne({ _id: entity._id, _version: entity._version - 1 }, entity);
        if (result.matchedCount !== 1) throw new Error(`Entity '${entity._id}' version mismatch.`);
    }

    public async delete(id: string): Promise<void> {
        const result = await this.client.db().collection<Entity>('entities').deleteOne({ _id: id });
        if (result.deletedCount !== 1) throw new Error(`Entity '${id}' does not exist.`);
    }
}
