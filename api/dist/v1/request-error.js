"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@poseidon/common");
/**
 * A custom Error class
 * @class
 */
class RequestError extends common_1.SysError {
    constructor(sysMsg, ...params) {
        super("request", sysMsg, ...params);
    }
}
exports.RequestError = RequestError;
//# sourceMappingURL=request-error.js.map