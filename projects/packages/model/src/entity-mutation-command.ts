import type { EntityId } from './entity';
import type { EntityData } from './entity-event';

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
    filter?: EntityFilter;
    limit?: number;
    offset?: number;
}

export type EntityFilter =
    | { operator: 'equals'; property: string; value: unknown }
    | { operator: 'contains'; property: string; value: unknown }
    | { operator: 'and'; filters: EntityFilter[] }
    | { operator: 'or'; filters: EntityFilter[] };
