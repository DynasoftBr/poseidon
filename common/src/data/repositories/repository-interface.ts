import { Entity, EntityType } from "../../models";

export interface RepositoryInterface {
    entityType: EntityType;
    deleteOne(_id: string): Promise<number>;
    update(entity: any): Promise<any>;
    insertOne(entity: any): Promise<any>;
    findById(id: string): Promise<any>;
    find(filter: object, skip: number, limit: number): Promise<any[]>;
    findOne(filter: object): Promise<any>;
}

export interface GenericRepositoryInterface<T extends Entity> extends RepositoryInterface {
    entityType: EntityType;
    deleteOne(_id: string): Promise<number>;
    update(entity: T): Promise<T>;
    insertOne(entity: T): Promise<T>;
    findById(id: string): Promise<T>;
    find(filter: object, skip: number, limit: number): Promise<T[]>;
    findOne(filter: object): Promise<T>;
}