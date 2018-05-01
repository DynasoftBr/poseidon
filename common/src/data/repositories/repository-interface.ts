import { Entity, EntityType } from "../../models";
import { ValidationProblem } from "../validation";

export interface RepositoryInterface {
    entityType: EntityType;
    deleteOne(_id: string): Promise<number>;
    update(entity: any): Promise<any>;
    insertOne(entity: any): Promise<any>;
    findOne(id: string): Promise<any>;
    findAll(skip: number, limit: number): Promise<any[]>;
}

export interface GenericRepositoryInterface<T extends Entity> extends RepositoryInterface {
    entityType: EntityType;
    deleteOne(_id: string): Promise<number>;
    update(entity: T): Promise<T>;
    insertOne(entity: T): Promise<T>;
    findOne(id: string): Promise<T>;
    findAll(skip: number, limit: number): Promise<T[]>;
}