import type { Entity, EntityId } from '../entity';

export type IndexDefinition = Entity<IndexDefinitionData>;

export type IndexDefinitionData = {
    entityTypeId: EntityId;
    name: string;
    propertyIds: EntityId[];
    unique?: boolean;
};
