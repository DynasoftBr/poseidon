import { RequestPipeline } from "../request-pipeline";
import { PipelineItem } from "../pipeline-item";
import { IQueryRequest } from "./query-request";
import { IRepositoryFactory } from "../../data";
import { IConcreteEntity, IEntityType } from "@poseidon/core-models";
import { IQueryResponse } from "./query-response";
import { Context } from "../../context";
import { queryFromRepository } from "./read/query-data";

export class QueryRequestPipeline<TResponse extends IConcreteEntity = IConcreteEntity> extends RequestPipeline<
  any,
  IQueryResponse<TResponse>
> {
  constructor(context: Context, entityType: IEntityType, query: any, repoFactory: IRepositoryFactory) {
    super({ context, entityType, query, repoFactory } as IQueryRequest, [queryFromRepository]);
  }

  public static async create<TResponse extends IConcreteEntity>(
    context: Context,
    entityType: IEntityType,
    query: any,
    repoFactory: IRepositoryFactory
  ) {
    return new QueryRequestPipeline<TResponse>(context, entityType, query, repoFactory);
  }
}
