import type { Entity, EntityId } from './entity';

export interface IndexDefinition extends Entity {
    entityTypeId: EntityId;
    name: string;
    propertyIds: EntityId[];
    unique?: boolean;
}
