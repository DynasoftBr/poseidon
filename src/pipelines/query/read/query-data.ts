import { IQueryRequest } from "../query-request";
import { PipelineItem } from "../../pipeline-item";
import { IQueryResponse } from "../query-response";
import { IConcreteEntity } from "@poseidon/core-models";
import { IResponse } from "../../response";

export async function queryFromRepository<
  T extends object = object,
  TResponse extends IConcreteEntity = IConcreteEntity
>(
  request: IQueryRequest<T, TResponse>,
  next: PipelineItem<T, IQueryResponse<TResponse>>
): Promise<IResponse<IQueryResponse<TResponse>>> {
  const { repoFactory, entityType, query } = request;
  const repo = await repoFactory.createById(entityType._id);

  request.response = request.response || {};
  request.response.result = {
    total: 0,
    data: (await repo.findMany(query)) as TResponse[]
  };

  return next(request);
}
