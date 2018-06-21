import { Entity, EntityType, ConcreteEntity } from "../../models";

export interface Repository<T extends ConcreteEntity = ConcreteEntity> {
    entityType: EntityType;
    findMany(filter: object, skip?: number, limit?: number, sort?: object): Promise<T[]>;
    findOne(filter: object): Promise<T>;
    findById(id: string): Promise<T>;
    insertOne(doc: T): Promise<boolean>;
    deleteOne(id: string): Promise<boolean>;
    updateOne(id: string, updateObj: T): Promise<boolean>;
}