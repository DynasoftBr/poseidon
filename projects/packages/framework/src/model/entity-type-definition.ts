import type { EntityType } from '../entity-types/entity-type';

export type EntityTypeDefinition = Omit<
    EntityType,
    '_version' | 'delete' | 'execute' | 'get' | 'save'
>;
