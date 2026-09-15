import type { Entity, EntityId } from '../entity';

export interface IndexDefinition extends Entity, IndexDefinitionData {}

export type IndexDefinitionData = {
    entityTypeId: EntityId;
    name: string;
    propertyIds: EntityId[];
    unique?: boolean;
};
