import { IRequest } from "../request";
import { Entity } from "@poseidon/core-models";

export type PartialWithIndex<T> = Partial<T> & { [key: string]: any };
export interface ICommandRequest<T extends Entity = Entity, TResponse = any> extends IRequest<PartialWithIndex<T>, TResponse> {
  command: string;
  event?: string;
  payload: T;
}
