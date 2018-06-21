import { Entity, ConcreteEntity } from "../models";

export interface Service<T extends ConcreteEntity = ConcreteEntity> {
    findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]>;
    findOne(filter: object): Promise<T>;
    insertOne(doc: T): Promise<T>;
    deleteOne(id: string): Promise<boolean>;
    updateOne(id: string, updateObj: T): Promise<T>;
}