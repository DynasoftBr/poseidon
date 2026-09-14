import type { EntityData, EntityId } from './entity';
import type { Specification } from './specification';

export interface NestedEntityEnvelope {
    id: EntityId;
    data: EntityData;
    expectedVersion?: number;
}

export interface CreateEntityCommand {
    id: EntityId;
    entityTypeId: EntityId;
    data: EntityData;
}

export interface UpdateEntityCommand {
    entityTypeId: EntityId;
    id: EntityId;
    data: EntityData;
    expectedVersion: number;
}

export interface DeleteEntityCommand {
    entityTypeId: EntityId;
    id: EntityId;
    expectedVersion: number;
}

export interface QueryEntitiesCommand {
    entityTypeId: EntityId;
    filter?: Specification;
    limit?: number;
    offset?: number;
}
