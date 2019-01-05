import { ConcreteEntity } from ".";
import { EntityTypeRef } from "./references/entity-type-ref";

export interface EntitySchema extends ConcreteEntity {
    schema: string;
    entityType: EntityTypeRef;
}