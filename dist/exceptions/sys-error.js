"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const _1 = require(".");
/**
 * A custom Error class
 * @class
 */
class SysError extends Error {
    /**
     * Contruscts the SysError class.
     * @param type The type of the error.
     * @param sysMsg The SysMsg object.
     * @param params Params to be formated into the message string.
     */
    constructor(type, sysMsg, ...params) {
        super(util.format(sysMsg.message, ...params));
        this.type = type;
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
    static unexpectedError(aditionalMsg) {
        return new SysError("unexpected", _1.SysMsgs.crash.unexpectedError, aditionalMsg);
    }
}
exports.SysError = SysError;
//# sourceMappingURL=sys-error.js.map