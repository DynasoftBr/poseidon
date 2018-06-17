import { ConcreteEntity } from "./";
import { EntityTypeRef } from "./helpers/entity-type-ref";

export interface EntitySchema extends ConcreteEntity {
    schema: string;
    entityType: EntityTypeRef;
}