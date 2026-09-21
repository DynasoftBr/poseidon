import type { DataStorage } from '@poseidon/data-access';
import type { Entity, EntityType } from '@poseidon/models';
import type { PoseidonContext } from './poseidon-context';
import { RuntimeRepository } from './runtime-repository';

export class RuntimeContext implements PoseidonContext {
    public constructor(public readonly storage: DataStorage) {}

    public repository<TEntity extends Entity = Entity>(
        entityType: EntityType,
    ): RuntimeRepository<TEntity> {
        return new RuntimeRepository<TEntity>(entityType, this);
    }
}
