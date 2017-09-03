import { SysError, SysMsgs, SysMsg } from "../";


/**
 * A custom Error class
 * @class
 */
export class DatabaseError extends SysError {
    constructor(sysMsg: SysMsg, ...params: any[]) {
        super("database", sysMsg, ...params);
    }
}