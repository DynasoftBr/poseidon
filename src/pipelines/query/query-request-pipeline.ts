import { RequestPipeline } from "../request-pipeline";
import { PipelineItem } from "../pipeline-item";
import { IQueryRequest } from "./query-request";
import { Entity, EntityType } from "@poseidon/core-models";
import { IQueryResponse } from "./query-response";
import { Context } from "../../data/context";
import { queryDataFromRepo } from "./common/query-data-from-repo";
import { IQueryModel } from "../../../poseidon-query-builder/query-model";

export class QueryRequestPipeline<TResponse extends Entity = Entity> extends RequestPipeline<any, IQueryResponse<TResponse>> {
  private constructor(context: Context, entityType: EntityType, query: IQueryModel) {
    super({ context, entityType, query } as IQueryRequest, [queryDataFromRepo]);
  }
}
