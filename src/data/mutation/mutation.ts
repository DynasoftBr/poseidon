import { Entity, EntityType } from "@poseidon/core-models";

export interface Mutation{
  payload: Partial<Entity>;
  action: "Add" | "Replace" | "Patch";
  entityType: EntityType;
}