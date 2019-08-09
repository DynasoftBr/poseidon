import { ICommandRequest } from "../command-request";
import { NextPipelineItem } from "../command-pipeline-item";
import { IEntityType, SysProperties } from "@poseidon/core-models";
import * as _ from "lodash";

export function mergeSuperProps(request: ICommandRequest<IEntityType>, next: NextPipelineItem) {

    // const _super = request.context.findOne({_id: })
    // request.entity.__super

    next(request);
}