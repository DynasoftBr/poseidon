import type { Entity, EntityId } from '../entity';
import type { EntityCommand } from '../entity-command';

export interface EntityType extends Entity, EntityTypeData {}

export type EntityTypeData = {
    name: string;
    label: string;
    properties: EntityId[];
    commands?: EntityCommand[];
};
