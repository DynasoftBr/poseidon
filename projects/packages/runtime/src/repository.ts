import type { Entity, EntityData, QueryEntitiesAction } from '@poseidon/models';

export interface Repository<TEntity extends Entity = Entity> {
    readonly entityTypeName: string;
    get(id: string): Promise<TEntity>;
    query(action: QueryEntitiesAction): Promise<TEntity[]>;
    execute(name: string, payload: EntityData): Promise<unknown>;
}
