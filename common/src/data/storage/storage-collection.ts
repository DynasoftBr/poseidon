import { ConcreteEntity } from "../../models";

export interface StorageCollection<T extends ConcreteEntity = ConcreteEntity> {
    ensureIndex(indexName: string, field: string, unique: boolean): void;
    dropIndex(indexName: string): void;
    drop(): void;
    findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]>;
    findOne(filter: object): Promise<T>;
    insertOne(doc: T): Promise<boolean>;
    deleteOne(id: string): Promise<boolean>;
    updateOne(id: string, updateObj: T): Promise<boolean>;
}