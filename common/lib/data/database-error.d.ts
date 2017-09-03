import { SysError, SysMsg } from "../";
/**
 * A custom Error class
 * @class
 */
export declare class DatabaseError extends SysError {
    constructor(sysMsg: SysMsg, ...params: any[]);
}
