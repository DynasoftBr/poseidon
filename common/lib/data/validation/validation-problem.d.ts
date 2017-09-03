import { ErrorObject } from "ajv";
import { SysMsg } from "../../";
export declare class ValidationProblem {
    property: string;
    keyword: string;
    code: number;
    message: string;
    constructor(property: string, keyword: string, sysMsg: SysMsg, ...params: any[]);
    static buildMsg(err: ErrorObject): ValidationProblem;
    toJSON(): {
        property: string;
        keyword: string;
        code: number;
        message: string;
    };
}
