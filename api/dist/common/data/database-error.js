"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("../");
/**
 * A custom Error class
 * @class
 */
class DatabaseError extends _1.SysError {
    constructor(sysMsg, ...params) {
        super("database", sysMsg, ...params);
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=database-error.js.map