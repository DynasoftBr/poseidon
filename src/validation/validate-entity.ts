import { ValidateFunction } from "ajv";
import { Entity } from "@poseidon/core-models";
import { ValidationProblem } from "../exceptions";

/**
 * Validates an entity returning  an array of ValidationProblem.
 * @param valFunc An Ajv.ValidateFunction to use to validate the entity.
 * @param entity The entity to be validated.
 * @returns An ValidationProblem[].
 */
export function validateEntity(valFunc: ValidateFunction, entity: Partial<Entity>): ValidationProblem[] {
    const valid = valFunc(entity);

    // If the obj is valid just return an empty array.
    if (valid) return [];

    // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
    const problems: ValidationProblem[] = new Array(valFunc.errors.length);
    valFunc.errors.forEach((err, idx) => problems[idx] = ValidationProblem.buildMsg(err));

    return problems;
}