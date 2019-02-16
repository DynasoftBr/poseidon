import * as path from "path";

import * as dotenv from "dotenv";
import * as winston from "winston"; // Logger. Uses configuration made in server.ts.

import * as Server from "./server";

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log(`Running enviroment ${process.env.NODE_ENV || "dev"}`);

/**
 * Config logger.
 */
winston.configure({
  level: process.env.LOG_LEVEL,
  transports: [
    new (winston.transports.File)({ filename: "sys.log", level: "error" }),
    new (winston.transports.Console)(),
  ]
});

Server.init();