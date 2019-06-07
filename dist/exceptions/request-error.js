"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
/**
 * A custom Error class
 * @class
 */
class RequestError extends _1.SysError {
    constructor(sysMsg, ...params) {
        super("request", sysMsg, ...params);
    }
}
exports.RequestError = RequestError;
//# sourceMappingURL=request-error.js.map