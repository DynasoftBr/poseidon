import { Entity } from "../models";
import { ValidationProblem } from "../validation/validation-problem";
export interface EntityValidator {
    validate(entity: Entity): Promise<ValidationProblem[]>;
}