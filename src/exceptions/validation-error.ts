import { ValidationProblem } from "./validation-problem";
import { SysMsgs, SysError } from ".";

/**
 * A custom Error class
 * @class
 */
export class ValidationError extends SysError {

    errorCount: number;
    constructor(public validationProblems: ValidationProblem[]) {
        super("validation", SysMsgs.validation.validationErrorMsg);

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