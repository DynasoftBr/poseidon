import { IQueryRequest } from "../query-request";
import { PipelineItem } from "../../pipeline-item";
import { IQueryResponse } from "../query-response";
import { IEntity } from "@poseidon/core-models";
import { IResponse } from "../../response";

export async function queryDataFromRepo<T extends object = object, TResponse extends IEntity = IEntity>(
  request: IQueryRequest<T, TResponse>,
  next: PipelineItem<T, IQueryResponse<TResponse>>
): Promise<IResponse<IQueryResponse<TResponse>>> {
  const { repoFactory, entityType, query } = request;
  const repo = await repoFactory.createById<TResponse>(entityType._id);

  const result = await repo.findMany(query);
  request.response = {
    result: {
      total: result.length,
      data: result
    }
  };

  return next(request);
}
