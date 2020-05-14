import { IResponse } from "../../response";
import { ICommandRequest } from "../command-request";
import { EntityType, SysEntities } from "@poseidon/core-models";
import { PipelineItem } from "../../pipeline-item";

export function migrateDatabase(request: ICommandRequest<EntityType>, next: PipelineItem): Promise<IResponse> {
  if (request.entityType.name === SysEntities.entityType) return next(request);


}
