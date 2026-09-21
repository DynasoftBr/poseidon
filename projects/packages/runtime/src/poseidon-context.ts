import type { Entity, EntityType } from '@poseidon/models';
import type { Repository } from './repository';

export interface PoseidonContext {
    repository<TEntity extends Entity = Entity>(entityType: EntityType): Repository<TEntity>;
}
