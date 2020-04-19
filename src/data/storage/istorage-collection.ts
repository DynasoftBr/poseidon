import { IEntity } from "@poseidon/core-models";

export interface IStorageCollection<T extends IEntity = IEntity> {
    ensureIndex(indexName: string, field: string, unique: boolean): void;
    dropIndex(indexName: string): void;
    drop(): void;
    findOne(upsert: object): Promise<T>;
    findMany(query: object[]): Promise<T[]>;
    findOne(query: object): Promise<T>;
    insertOne(doc: T): Promise<boolean>;
    upsert(doc: T): Promise<boolean>;
    deleteOne(id: string): Promise<boolean>;
    updateOne(id: string, updateObj: T): Promise<boolean>;
}