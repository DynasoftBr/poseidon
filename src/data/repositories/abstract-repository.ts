
import { DatabaseError, SysMsgs } from "../../exceptions";
import { MongoError } from "mongodb";
import { EventEmitter } from "events";
import { IDataStorage, IStorageCollection } from "../storage";
import { IConcreteEntity, IEntityType } from "@poseidon/core-models";
import { IRepository } from "./irepository";

export abstract class AbstractRepository<T extends IConcreteEntity>
    extends EventEmitter
    implements IRepository<T> {

    protected constructor(
        protected readonly collection: IStorageCollection<T>,
        protected readonly storage: IDataStorage,
        public readonly entityType: IEntityType) {
        super();
    }

    async deleteOne(id: string): Promise<boolean> {
        return await this.collection.deleteOne(id);
    }

    async updateOne(id: string, entity: T): Promise<boolean> {
        return this.collection.updateOne(id, entity);
    }

    async insertOne(entity: T): Promise<boolean> {
        return this.collection.insertOne(entity);
    }

    async findById(id: string): Promise<T> {
        return await this.collection.findOne({ _id: id });
    }

    async findMany(filter: object, skip: number, limit: number): Promise<T[]> {
        return await this.collection.findMany(filter, skip, limit);
    }

    async findOne(filter: object) {
        return await this.collection.findOne(filter);
    }

    handleError(error: any) {
        if (error instanceof MongoError)
            throw new DatabaseError(SysMsgs.error.databaseLevelError, error);

        throw error;
    }
}