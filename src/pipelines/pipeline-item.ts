import { IRequest } from "./request";
import { IResponse } from "./response";

export type PipelineItem<T = any, TResponse = any> = (
  request: IRequest<T, TResponse>,
  next?: PipelineItem<T, TResponse>
) => Promise<IResponse<TResponse>>;
