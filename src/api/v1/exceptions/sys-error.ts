import { SysMsgs } from "./sys-msgs";
import * as util from "util";

/**
 * A custom Error class
 * @class
 */
export class SysError extends Error {
    /**
     * Constructs the SysError class
     * @param {String} message an error message
     * @constructor
     */
    constructor(public type: string, public code: number, public message: string) {
        super(message);

        // properly capture stack trace in Node.js
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.message = message;
        this.code = code;
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
        return new SysError("unexpected", SysMsgs.crash.unexpectedError.code,
            util.format(SysMsgs.crash.unexpectedError.message, aditionalMsg));
    }
}