import { EntityType, Entity } from "../models";
export declare class EntityRepository {
    private static _instance;
    private _collection;
    protected entityType: EntityType;
    private constructor();
    private static getInstance(entityType);
    static getRepositoty(entityTypeName: string): Promise<EntityRepository>;
    findAll(skip?: number, limit?: number): Promise<Entity[]>;
    findOne(id: string): Promise<Entity>;
    query(mquery: object): Promise<Entity[]>;
    create(entity: Entity): Promise<string>;
    update(entity: Entity): Promise<void>;
    del(_id: Entity): Promise<number>;
}
