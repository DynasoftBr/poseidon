import type { Entity, EntityId } from '../entity';

export type Identity = Entity<IdentityData>;

export interface IdentityData {
    name: string;
    owner: EntityId;
    members: EntityId[];
    memberOf: EntityId[];
}
