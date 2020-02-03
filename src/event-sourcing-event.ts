import { IConcreteEntity } from "@poseidon/core-models";

export interface EventSourcingEvent<T extends IConcreteEntity = IConcreteEntity> {
  _id: string;
  aggregateId: string;
  date: Date;
  event: Partial<T>;
}
