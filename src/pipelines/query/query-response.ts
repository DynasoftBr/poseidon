import { IResponse } from "../response";

export interface IQueryResponse<T> {
  total: number;
  data: T[];
}
