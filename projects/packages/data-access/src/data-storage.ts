import type { Entity } from '@poseidon/models';

export interface DataStorage {
    getById(entityTypeName: string, id: string): Promise<Entity | null>;
    create(entityTypeName: string, entity: Entity): Promise<void>;
    update(entityTypeName: string, entity: Entity): Promise<void>;
    delete(entityTypeName: string, id: string): Promise<void>;
}
