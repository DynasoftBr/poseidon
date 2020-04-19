import { IEntity } from "@poseidon/core-models";

export interface EventSourcingEvent<T extends IEntity = IEntity> {
  _id: string;
  aggregateId: string;
  date: Date;
  event: Partial<T>;
}
