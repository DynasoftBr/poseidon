import type { Entity, QueryEntitiesAction } from '@poseidon/models';

export interface DataStorage {
    get(entityTypeName: string, id: string): Promise<Entity | null>;
    query(entityTypeName: string, action: QueryEntitiesAction): Promise<Entity[]>;
    create(entityTypeName: string, entity: Entity): Promise<void>;
    update(entityTypeName: string, entity: Entity): Promise<void>;
    delete(entityTypeName: string, id: string): Promise<void>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    abortTransaction(): Promise<void>;
}
