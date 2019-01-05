import { StorageCollection } from "../storage-collection";
import * as LokiDb from "lokijs";
import { ConcreteEntity } from "../../../models";
import * as _  from "lodash";

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
        const clone: any = _.cloneDeep(await this.collection.find(filter));
        delete (clone.$loki);
        delete (clone.meta);
        return clone;
    }

    async findOne(filter: object): Promise<T> {
        try {
            const clone: any = _.cloneDeep(await this.collection.findOne(filter));
            delete (clone.$loki);
            delete (clone.meta);
            return clone;
        } catch (error) {
            /// this.handleError(error);
        }
    }

    async insertOne(doc: T): Promise<boolean> {
        try {
            const clone: any = _.cloneDeep(doc);
            const result = await this.collection.insertOne(clone);
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