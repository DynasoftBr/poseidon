import { IRequest } from "../../request";
import { PipelineItem } from "../../pipeline-item";
import { DataStorage } from "../../../data";

export async function attachEntityType(storage: DataStorage, entityTypeName: string) {
  return async (request: IRequest, next: PipelineItem) => {
    // const entityType = storage.entityTypes.find((c) => c.name === entityTypeName);
    // request.entityType = entityType;
    return await next(request);
  };
}
