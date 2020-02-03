import { IRequest } from "../request";
import { IQueryResponse } from "./query-response";
import { IRepositoryFactory } from "../../data";

export interface IQueryRequest<T = any, TResponse = any> extends IRequest<T, IQueryResponse<TResponse>> {
  repoFactory: IRepositoryFactory;
  query: any;
}
