import { ICommandRequest } from "../command-request";
import { EntityType, SysProperties } from "@poseidon/core-models";
import * as _ from "lodash";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";
import { builtInEntries } from "../../../data";

export async function validateMandatoryProps(request: ICommandRequest, next: PipelineItem): Promise<IResponse> {
  const entity = request.payload;

  if (_.filter((<EntityType>entity).props, { name: SysProperties.changedAt }).length === 0)
    (<EntityType>entity).props.push(builtInEntries.changedAtProperty);

  if (_.filter((<EntityType>entity).props, { name: SysProperties.createdAt }).length === 0)
    (<EntityType>entity).props.push(builtInEntries.createdAtProperty);

  if (_.filter((<EntityType>entity).props, { name: SysProperties._id }).length === 0)
    (<EntityType>entity).props.push(builtInEntries.idProperty);

  return next(request);
}
