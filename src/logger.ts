import * as winston from "winston";
import { env } from "./env.config";

const consoleFormat = winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`);

export const logger = winston.createLogger({
    level: env.log.level,
    format: winston.format.timestamp(),
    transports: [
        new winston.transports.File({ filename: "sys.log", level: "error" }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                consoleFormat
            )
        }),
    ]
});