"use strict";
exports.__esModule = true;
exports.logger = void 0;
var winston = require("winston");
var env_config_1 = require("./env.config");
var consoleFormat = winston.format.printf(function (info) { return info.timestamp + " - " + info.level + ": " + info.message; });
exports.logger = winston.createLogger({
    level: env_config_1.env.log.level,
    format: winston.format.timestamp(),
    transports: [
        new winston.transports.File({ filename: "sys.log", level: "error" }),
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), consoleFormat)
        }),
    ]
});
