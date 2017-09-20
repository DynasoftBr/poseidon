import * as util from "util";

import { SysMsg } from "./sys-msg";
import { SysMsgs } from "./sys-msgs";

/**
 * A custom Error class
 * @class
 */
export class SysError extends Error {
    public code: number;

    /**
     * Contruscts the SysError class.
     * @param type The type of the error.
     * @param sysMsg The SysMsg object.
     * @param params Params to be formated into the message string.
     */
    constructor(public type: string = "System", sysMsg: SysMsg, ...params: any[]) {
        super(util.format(sysMsg.message, ...params));

        // properly capture stack trace in Node.js
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = sysMsg.code;
        this.type = type;
    }

    toJSON() {
        return { type: this.type, code: this.code, message: this.message };
    }


    /**
     * Returns a new SysError class for 'Unexpected Error' error.
     * @func
     * @static
     * @param aditionalMsg: A complement for the default message.
     */
    static unexpectedError(aditionalMsg: string): SysError {
        return new SysError("unexpected", SysMsgs.crash.unexpectedError, aditionalMsg);
    }
}