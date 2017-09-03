"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("../../");
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
        return {
            type: this.type,
            code: this.code,
            message: this.message,
            errorCount: this.errorCount,
            validationProblems: this.validationProblems
        };
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=validation-error.js.map