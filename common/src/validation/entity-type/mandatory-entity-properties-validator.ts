import { EntityValidator } from "../entity-validator";
import { ValidationProblem } from "../../validation/validation-problem";
import { EntityType } from "../../models";
import { BuiltInEntries, SysMsgs } from "../..";
import { ProblemKeywords } from "../../constants";
import *  as _ from "lodash";

export class MandatoryEntityPropertiesValidator implements EntityValidator {
    async validate(entity: EntityType): Promise<ValidationProblem[]> {
        const problems: ValidationProblem[] = [];
        const buildIn = new BuiltInEntries();
        const requiredProps = [
            buildIn.idPropertyDefinition,
            buildIn.createdAtPropertyDefinition,
            buildIn.createdByPropertyDefinition,
            buildIn.changedAtPropertyDefinition,
            buildIn.changedByPropertyDefinition
        ];

        requiredProps.forEach(reqProp => {
            const prop = _.find(entity.props, { name: reqProp.name });

            if (prop == null)
                problems.push(new ValidationProblem(reqProp.name, ProblemKeywords.missingMadatoryEntityProperty,
                    SysMsgs.validation.missingRequiredEntityProperty, reqProp));

            // else if (!_.isEqual(prop[0], reqProp))
            //     problems.push(new ValidationProblem(reqProp.name, ProblemKeywords.invalidMandatoryEntityProperty,
            //         SysMsgs.validation.invalidRequiredEntityProperty, reqProp));
        });

        return problems;
    }
}