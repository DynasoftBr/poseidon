"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ajv = require("ajv");
/**
 * Builds an Ajv.ValidationFunction.
 * @param schema A valid schema model.
 */
function buildValidationFunc(schema) {
    const jsonVal = new Ajv({ allErrors: true, verbose: true });
    return jsonVal.compile(schema);
}
exports.buildValidationFunc = buildValidationFunc;
//# sourceMappingURL=build-validation-func.js.map