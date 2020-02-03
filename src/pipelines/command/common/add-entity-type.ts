import { IRequest } from "../../request";
import { PipelineItem } from "../../pipeline-item";
import { IRepositoryFactory } from "../../../data";

export async function attachEntityType(repositoryFactory: IRepositoryFactory, entityTypeName: string) {
  return async (request: IRequest, next: PipelineItem) => {
    const entityType = await (await repositoryFactory.entityType()).findOne({ name: entityTypeName });
    request.entityType = entityType;
    return await next(request);
  };
}
