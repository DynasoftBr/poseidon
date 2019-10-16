import { ICommandRequest } from "../command-request";
import { NextPipelineItem } from "../command-pipeline-item";
import { BuiltInEntries } from "../../../data";
import { IEntityType, SysProperties } from "@poseidon/core-models";
import * as _ from "lodash";

export function addSuperProps(request: ICommandRequest<IEntityType>, next: NextPipelineItem) {

    // const $super = request.context.
    // request.entity.props

    //     next(request);
}