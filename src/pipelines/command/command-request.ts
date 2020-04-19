import { IEntityType, IEntity } from "@poseidon/core-models";
import { Context } from "../../context";
import { IResponse } from "../response";
import { IRequest } from "../request";

export type PartialWithIndex<T> = Partial<T> & { [key: string]: any };
export interface ICommandRequest<T extends IEntity = IEntity, TResponse = any>
  extends IRequest<PartialWithIndex<T>, TResponse> {
  command: string;
  event?: string;
  payload: T; 
}
