import { Entity, EntityProperty } from "./";
import { EntityTypeRef } from "./helpers/entity-type-ref";

export interface EntitySchema extends Entity {
    schema: string;
    entityType: EntityTypeRef;
}