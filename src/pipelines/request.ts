import { Context } from "../data/context";
import { IResponse } from "./response";
import { EntityType } from "@poseidon/core-models";

export interface IRequest<T = any, TResponse = any> {
  context: Context;
  entityType?: EntityType;
  response?: IResponse<TResponse>;
}
