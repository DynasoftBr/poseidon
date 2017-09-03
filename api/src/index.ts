import * as dotenv from "dotenv";
import winston = require("winston");

import { DataAccess } from "./common";
import * as Server from "./server";

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: __dirname + "/../.env" });

console.log(`Running enviroment ${process.env.NODE_ENV || "dev"}`);

/**
 * Config logger.
 */
winston.level = process.env.LOG_LEVEL;
winston.configure({
  transports: [
    new (winston.transports.File)({ filename: "sysLog.log", level: "error" }),
    new (winston.transports.Console)(),
  ]
});

// Catch unhandling unexpected exceptions
process.on("uncaughtException", (error: Error) => {
  winston.error(`unhandled exception ${error.message}`);
});

// Catch unhandling rejected promises
process.on("unhandledRejection", (reason: any) => {
  winston.error(`unhandledRejection ${reason}`);
});

// connect to database
DataAccess.connect({ connectionString: process.env.MONGODB_URI }).then(db => {
  // let coll = db.collection("EntityType1");
  // // coll.createIndexes([{ key: { "created_by.name": 1 }, unique: true }]).then(res => {
  // coll.indexes().then(idxs => {
  //   console.log(idxs);
  // });
  // // });
});

// Start server
Server.init();