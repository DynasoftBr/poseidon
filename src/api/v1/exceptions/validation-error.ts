import * as util from "util";

import { SysMsgs, SysError } from "./";
import { ValidationProblem } from "../data/validation/";

/**
 * A custom Error class
 * @class
 */
export class ValidationError extends SysError {

    errorCount: number;
    constructor(public validationProblems: ValidationProblem[]) {
        super("validation",
            SysMsgs.validation.validationErrorMsg.code,
            SysMsgs.validation.validationErrorMsg.message);
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