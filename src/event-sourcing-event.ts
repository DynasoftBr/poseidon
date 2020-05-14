import { Entity } from "@poseidon/core-models";

export interface EventSourcingEvent<T extends Entity = Entity> {
  _id: string;
  aggregateId: string;
  date: Date;
  event: Partial<T>;
}
