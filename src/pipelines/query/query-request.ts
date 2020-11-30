import { IRequest } from "../request";
import { IQueryResponse } from "./query-response";
import { Query } from "../../query-builder/interfaces/query";

export interface IQueryRequest<T = any, TResponse = any> extends IRequest<T, IQueryResponse<TResponse>> {
  query: Query<T>;
}
