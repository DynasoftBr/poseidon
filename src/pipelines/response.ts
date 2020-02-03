import { SysError } from "../exceptions";

export interface IResponse<T = any> {
  error?: SysError;
  result?: T;
}
