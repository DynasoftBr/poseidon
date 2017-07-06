import * as util from "util";

import { SysMsgs, SysError } from "./";

/**
 * A custom Error class
 * @class
 */
export class DatabaseError extends SysError {
    constructor(message: string) {
        super("database", SysMsgs.error.databaseLevelError.code,
            util.format(SysMsgs.error.databaseLevelError.message, message));
    }


    /**
     * Returns a new DatabaseError class for 'Database Connection Failed' error.
     * @func
     * @static
     */
    static databaseConnectionFailed(aditionalMsg: string): DatabaseError {
        return new DatabaseError(aditionalMsg);
    }
}