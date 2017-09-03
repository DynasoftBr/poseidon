import { SysError } from "../../";
import { ValidationProblem } from "./";
/**
 * A custom Error class
 * @class
 */
export declare class ValidationError extends SysError {
    validationProblems: ValidationProblem[];
    errorCount: number;
    constructor(validationProblems: ValidationProblem[]);
    toJSON(): {
        type: string;
        code: number;
        message: string;
        errorCount: number;
        validationProblems: ValidationProblem[];
    };
}
