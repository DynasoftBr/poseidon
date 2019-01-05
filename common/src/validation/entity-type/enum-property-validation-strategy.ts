import { EntityPropertyValidationStrategy } from "./entity-property-validation-strategy";
import { EntityProperty } from "../../models";
import { ValidationProblem } from "../../validation/validation-problem";
import { PropertyTypes, ProblemKeywords } from "../../constants";
import { SysMsgs } from "../../sys-msgs";

export class EnumPropertyValidationStrategy implements EntityPropertyValidationStrategy {

    async validate(prop: EntityProperty, problems: ValidationProblem[]): Promise<ValidationProblem[]> {
        if (prop.validation.type === PropertyTypes.enum) {
            if (!prop.validation.enum)
                problems.push(new ValidationProblem(prop.name, ProblemKeywords.required, SysMsgs.validation.required, prop.name));
            else if (prop.validation.enum.length == 0) {
                problems.push(new ValidationProblem(prop.name, ProblemKeywords.minItems, SysMsgs.validation.minItems, prop.name, 1));
            }
        }

        return problems;
    }
}