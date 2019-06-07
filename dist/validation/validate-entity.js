"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
/**
 * Validates an entity returning  an array of ValidationProblem.
 * @param valFunc An Ajv.ValidateFunction to use to validate the entity.
 * @param entity The entity to be validated.
 * @returns An ValidationProblem[].
 */
function validateEntity(valFunc, entity) {
    const valid = valFunc(entity);
    // If the obj is valid just return an empty array.
    if (valid)
        return [];
    // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
    const problems = new Array(valFunc.errors.length);
    valFunc.errors.forEach((err, idx) => problems[idx] = exceptions_1.ValidationProblem.buildMsg(err));
    return problems;
}
exports.validateEntity = validateEntity;
//# sourceMappingURL=validate-entity.js.map