import { Entity, EntityType } from "@poseidon/core-models";
import { MutationState } from "./mutation-state";

export type ObservedEntity<T extends Entity> = {
  readonly __entityType?: EntityType;
  readonly __mutationState?: MutationState;
  readonly __observed?: true;
} & T;
