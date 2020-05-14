import { IRequest } from "../../request";
import { PipelineItem } from "../../pipeline-item";
import { IDataStorage } from "../../../data";

export async function attachEntityType(storage: IDataStorage, entityTypeName: string) {
  return async (request: IRequest, next: PipelineItem) => {
    const entityType = storage.entityTypes.find((c) => c.name === entityTypeName);
    request.entityType = entityType;
    return await next(request);
  };
}
