import type { Entity } from '@poseidon/models';

export interface DataStorage {
    getById(id: string): Promise<Entity | null>;
    create(entity: Entity): Promise<void>;
    update(entity: Entity): Promise<void>;
    delete(id: string): Promise<void>;
}
