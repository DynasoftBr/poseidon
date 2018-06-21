import { StorageCollection } from "../storage-collection";
import * as LokiDb from "lokijs";
import { ConcreteEntity } from "../../../models";
import _ = require("lodash");

export class InMemoryStorageCollection<T extends ConcreteEntity = ConcreteEntity>
    implements StorageCollection<T> {

    private collection: LokiDb.Collection<T>;
    constructor(private readonly db: LokiDb, collectionName: string) {
        this.collection = db.getCollection<T>(collectionName);

        if (this.collection == null)
            this.collection = db.addCollection(collectionName);
    }

    ensureIndex(indexName: string, field: string, unique: boolean): void {
        throw new Error("Method not implemented.");
    }

    dropIndex(indexName: string): void {
        throw new Error("Method not implemented.");
    }

    drop(): void {
        throw new Error("Method not implemented.");
    }

    async findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]> {
        return await this.collection.find(filter);
    }

    async findOne(filter: object): Promise<T> {
        try {
            return await this.collection.findOne(filter);
        } catch (error) {
            /// this.handleError(error);
        }
    }

    async insertOne(doc: T): Promise<boolean> {
        try {
            const result = await this.collection.insertOne(doc);
            return result != null;
        } catch (error) {
            /// this.handleError(error);
        }
    }

    async deleteOne(id: string): Promise<boolean> {
        try {
            const result = await this.collection.removeWhere(et => et._id == id);
            return true;
        } catch (error) {
            /// this.handleError(error);
        }
    }

    async updateOne(id: string, updateObj: T): Promise<boolean> {
        try {
            const result = await this.collection.updateWhere(et => et._id == id, (oldEntity) => {
                _.assignIn(oldEntity, updateObj);
            });
            return true;
        } catch (error) {
            /// this.handleError(error);
        }
    }
}