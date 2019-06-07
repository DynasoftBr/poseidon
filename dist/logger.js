"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
exports.logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    transports: [
        new (winston.transports.File)({ filename: "sys.log", level: "error" }),
        new (winston.transports.Console)(),
    ]
});
//# sourceMappingURL=logger.js.map