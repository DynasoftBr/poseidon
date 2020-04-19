import { RequestPipeline } from "../request-pipeline";
import { PipelineItem } from "../pipeline-item";
import { IQueryRequest } from "./query-request";
import { IRepositoryFactory } from "../../data";
import { IEntity, IEntityType } from "@poseidon/core-models";
import { IQueryResponse } from "./query-response";
import { Context } from "../../context";
import { queryDataFromRepo } from "./common/query-data-from-repo";
import { IQueryModel } from "../../../poseidon-query-builder/query-model";
import { parseQuery } from "./common/parse-query";

export class QueryRequestPipeline<TResponse extends IEntity = IEntity> extends RequestPipeline<any, IQueryResponse<TResponse>> {
  private constructor(context: Context, entityType: IEntityType, query: IQueryModel, repoFactory: IRepositoryFactory) {
    super({ context, entityType, query, repoFactory } as IQueryRequest, [parseQuery, queryDataFromRepo]);
  }

  public static async create<TResponse extends IEntity>(context: Context, entityType: IEntityType, query: IQueryModel, repoFactory: IRepositoryFactory) {
    return new QueryRequestPipeline<TResponse>(context, entityType, query, repoFactory);
  }
}
