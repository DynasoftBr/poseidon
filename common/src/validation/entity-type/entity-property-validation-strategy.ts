import { ValidationProblem } from "../../validation/validation-problem";
import { EntityProperty } from "../../models";

export interface EntityPropertyValidationStrategy {
    validate(prop: EntityProperty, problems: ValidationProblem[]): Promise<ValidationProblem[]>;
}