import { ICommandRequest } from "../command-request";
import { NextPipelineItem } from "../command-pipeline-item";
import { BuiltInEntries } from "../../../data";
import { IEntityType, SysProperties } from "@poseidon/core-models";
import * as _ from "lodash";

export function ValidateMandatoryProps(request: ICommandRequest, next: NextPipelineItem) {

    const builtin = new BuiltInEntries();
    const { entity } = request;

    if (_.filter((<IEntityType>entity).props, { name: SysProperties.changedAt })
        .length == 0)
        (<IEntityType>entity).props.push(builtin.changedAtPropertyDefinition);

    if (_.filter((<IEntityType>entity).props, { name: SysProperties.changedBy })
        .length == 0)
        (<IEntityType>entity).props.push(builtin.changedByPropertyDefinition);

    if (_.filter((<IEntityType>entity).props, { name: SysProperties.createdAt })
        .length == 0)
        (<IEntityType>entity).props.push(builtin.createdAtPropertyDefinition);

    if (_.filter((<IEntityType>entity).props, { name: SysProperties.createdBy })
        .length == 0)
        (<IEntityType>entity).props.push(builtin.createdByPropertyDefinition);

    if (_.filter((<IEntityType>entity).props, { name: SysProperties._id })
        .length == 0)
        (<IEntityType>entity).props.push(builtin.idPropertyDefinition);

    next(request);
}