import { RequestPipeline } from "../request-pipeline";
import { PipelineItem } from "../pipeline-item";
import { IQueryRequest } from "./query-request";
import { Entity, EntityType } from "@poseidon/core-models";
import { IQueryResponse } from "./query-response";
import { Context } from "../../data/context";
import { queryDataFromRepo } from "./common/query-data-from-repo";
import { Query } from "../../query-builder/interfaces/query";

export class QueryRequestPipeline<TResponse extends Entity = Entity> extends RequestPipeline<any, IQueryResponse<TResponse>> {
  public constructor(context: Context, entityType: EntityType, query: Query<TResponse>) {
    super({ context, entityType, query } as IQueryRequest, [queryDataFromRepo]);
  }
}