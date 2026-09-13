import type { Entity, EntityId } from './entity';
import type { EntityCommand } from './entity-command';

export type EntityType = Entity<EntityTypeData>;

export type EntityTypeData = {
    name: string;
    label: string;
    abstract?: boolean;
    properties: EntityId[];
    superTypeId?: EntityId;
    commands?: EntityCommand[];
};
