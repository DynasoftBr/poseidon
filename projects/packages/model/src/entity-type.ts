import type { Entity, EntityId } from './entity';
import type { EntityCommand } from './entity-command';

export interface EntityType extends Entity {
    name: string;
    label: string;
    abstract?: boolean;
    properties: EntityId[];
    superTypeId?: EntityId;
    commands?: EntityCommand[];
}
