import type { Entity, EntityType } from '@poseidon/models';
import type { ClientSession, MongoClient } from 'mongodb';
import type { DataStorage } from './data-storage';

export class MongoDataStorage implements DataStorage {
    private session?: ClientSession;
    private transactionDepth = 0;

    public constructor(private readonly client: MongoClient) {}

    public async get(entityTypeName: string, id: string): Promise<Entity | null> {
        return await this.client
            .db()
            .collection<Entity>(entityTypeName)
            .findOne({ _id: id }, this.session ? { session: this.session } : undefined);
    }

    public async getEntityType(name: string): Promise<EntityType | null> {
        return await this.client
            .db()
            .collection<EntityType>('entity-type')
            .findOne({ name }, this.session ? { session: this.session } : undefined);
    }

    public async create(entityTypeName: string, entity: Entity): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        await this.client
            .db()
            .collection<Entity>(entityTypeName)
            .insertOne(entity, this.session ? { session: this.session } : undefined);
    }

    public async update(entityTypeName: string, entity: Entity): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        const result = await this.client
            .db()
            .collection<Entity>(entityTypeName)
            .replaceOne(
                { _id: entity._id },
                entity,
                this.session ? { session: this.session } : undefined,
            );
        if (result.matchedCount !== 1) throw new Error(`Entity '${entity._id}' does not exist.`);
    }

    public async delete(entityTypeName: string, id: string): Promise<void> {
        await this.requireConcreteType(entityTypeName);
        const result = await this.client
            .db()
            .collection<Entity>(entityTypeName)
            .deleteOne({ _id: id }, this.session ? { session: this.session } : undefined);
        if (result.deletedCount !== 1) throw new Error(`Entity '${id}' does not exist.`);
    }

    public beginTransaction(): Promise<void> {
        if (this.session) {
            this.transactionDepth += 1;
            return Promise.resolve();
        }
        this.session = this.client.startSession();
        this.session.startTransaction();
        this.transactionDepth = 1;
        return Promise.resolve();
    }

    public async commitTransaction(): Promise<void> {
        this.transactionDepth -= 1;
        if (this.transactionDepth > 0) return;
        try {
            await this.session?.commitTransaction();
        } finally {
            await this.endSession();
        }
    }

    public async abortTransaction(): Promise<void> {
        try {
            await this.session?.abortTransaction();
        } finally {
            await this.endSession();
        }
    }

    private async endSession(): Promise<void> {
        await this.session?.endSession();
        this.session = undefined;
        this.transactionDepth = 0;
    }

    private async requireConcreteType(name: string): Promise<void> {
        const entityType = await this.getEntityType(name);
        if (entityType?.structure === true) {
            throw new Error(`Structure '${name}' cannot be persisted independently.`);
        }
    }
}
