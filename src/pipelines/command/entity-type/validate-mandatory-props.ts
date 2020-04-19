import { ICommandRequest } from "../command-request";
import { BuiltInEntries } from "../../../data";
import { IEntityType, SysProperties } from "@poseidon/core-models";
import * as _ from "lodash";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";

export async function validateMandatoryProps(request: ICommandRequest, next: PipelineItem): Promise<IResponse> {
  const builtin = BuiltInEntries.build();
  const entity = request.payload;

  if (_.filter((<IEntityType>entity).props, { name: SysProperties.changedAt }).length === 0)
    (<IEntityType>entity).props.push(builtin.changedAtProperty);

  if (_.filter((<IEntityType>entity).props, { name: SysProperties.createdAt }).length === 0)
    (<IEntityType>entity).props.push(builtin.createdAtProperty);

  if (_.filter((<IEntityType>entity).props, { name: SysProperties._id }).length === 0)
    (<IEntityType>entity).props.push(builtin.idProperty);

  return next(request);
}
