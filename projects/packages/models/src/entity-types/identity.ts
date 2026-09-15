import type { Entity, EntityId } from '../entity';

export interface Identity extends Entity, IdentityData {}

export interface IdentityData {
    name: string;
    owner: EntityId;
    members: EntityId[];
    memberOf: EntityId[];
}
