import type { EntityData, EntityId } from './entity';
import type { Specification } from './specification';

export interface NestedEntityEnvelope {
    id: EntityId;
    data: EntityData;
    expectedVersion?: number;
}

export interface CreateEntityAction {
    id: EntityId;
    entityTypeId: EntityId;
    data: EntityData;
}

export interface UpdateEntityAction {
    entityTypeId: EntityId;
    id: EntityId;
    data: EntityData;
    expectedVersion: number;
}

export interface DeleteEntityAction {
    entityTypeId: EntityId;
    id: EntityId;
    expectedVersion: number;
}

export interface QueryEntitiesAction {
    entityTypeId: EntityId;
    filter?: Specification;
    limit?: number;
    offset?: number;
}
