import { Context } from "../context";
import { IResponse } from "./response";
import { IEntityType } from "@poseidon/core-models";

export interface IRequest<T = any, TResponse = any> {
  context: Context;
  entityType?: IEntityType;
  response?: IResponse<TResponse>;
}
