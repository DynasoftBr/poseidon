import type { Entity } from '@poseidon/models';
import type { Repository } from './repository';
import type { EntityForTypeName } from './system';

export interface PoseidonContext {
    readonly user: Entity;
    repository<TName extends string>(entityTypeName: TName): Repository<EntityForTypeName<TName>>;
}
