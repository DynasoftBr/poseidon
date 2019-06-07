import winston = require("winston");

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    transports: [
        new (winston.transports.File)({ filename: "sys.log", level: "error" }),
        new (winston.transports.Console)(),
    ]
});