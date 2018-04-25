import * as path from "path";

import * as dotenv from "dotenv";
import * as winston from "winston"; // Logger. Uses configuration made in server.ts.

import { DataAccess, DatabaseError, SysMsgs } from "@poseidon/common";
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

// connect to database
DataAccess.connect({
  url: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME,
  retries: parseInt(process.env.RETRIES),
  timeBetweenRetries: parseInt(process.env.TIME_BETWEEN_RETRIES)
}).then(db => {
  // let coll = db.collection("EntityType1");
  // // coll.createIndexes([{ key: { "created_by.name": 1 }, unique: true }]).then(res => {
  // coll.indexes().then(idxs => {
  //   console.log(idxs);
  // });
  // // });
}).catch(err => {
  winston.error(new DatabaseError(SysMsgs.error.databaseLevelError, err).message);
  process.exit(SysMsgs.error.databaseLevelError.code);
});

/**
 * Start Server.
 */
Server.init();