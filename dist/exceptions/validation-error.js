"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
/**
 * A custom Error class
 * @class
 */
class ValidationError extends _1.SysError {
    constructor(validationProblems) {
        super("validation", _1.SysMsgs.validation.validationErrorMsg);
        this.validationProblems = validationProblems;
        this.errorCount = validationProblems.length;
    }
    toJSON() {
        const { type, code, message, errorCount, validationProblems } = this;
        return {
            type,
            code,
            message,
            errorCount,
            validationProblems
        };
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=validation-error.js.map