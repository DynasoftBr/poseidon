import { ICommandRequest } from "../command-request";
import { IEntityType, SysProperties } from "@poseidon/core-models";
import * as _ from "lodash";
import { PipelineItem } from "../../pipeline-item";

export function addSuperProps(request: ICommandRequest<IEntityType>, next: PipelineItem) {
  // const $super = request.context.
  // request.entity.props
  //     next(request);
}
