import { ICommandRequest } from "../command-request";
import { NextPipelineItem } from "../command-pipeline-item";
import { BuiltInEntries } from "../../../data";
import * as _ from "lodash";
import { ValidationProblem, SysMsgs } from "../../../exceptions";
import { ProblemKeywords, IEntityType } from "@poseidon/core-models/src";

export async function addMandatoryProps(request: ICommandRequest<IEntityType>, next?: NextPipelineItem) {

    const problems = request.problems = request.problems || [];
    const entity = request.entity;
    const buildIn = new BuiltInEntries();
    const requiredProps = [
        buildIn.idPropertyDefinition,
        buildIn.createdAtPropertyDefinition,
        buildIn.createdByPropertyDefinition,
        buildIn.changedAtPropertyDefinition,
        buildIn.changedByPropertyDefinition
    ];

    requiredProps.forEach((reqProp) => {
        const prop = _.find(entity.props, { name: reqProp.name });

        if (prop == null)
            problems.push(new ValidationProblem(reqProp.name, ProblemKeywords.missingMadatoryEntityProperty,
                SysMsgs.validation.missingRequiredEntityProperty, reqProp.name));

        else if (!_.isEqual(prop, reqProp))
            problems.push(new ValidationProblem(reqProp.name, ProblemKeywords.invalidMandatoryEntityProperty,
                SysMsgs.validation.invalidRequiredEntityProperty, reqProp.name));
    });

    next(request);
}