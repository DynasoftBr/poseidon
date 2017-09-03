"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const winston = require("winston");
const common_1 = require("./common");
const Server = require("./server");
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
process.on("uncaughtException", (error) => {
    winston.error(`unhandled exception ${error.message}`);
});
// Catch unhandling rejected promises
process.on("unhandledRejection", (reason) => {
    winston.error(`unhandledRejection ${reason}`);
});
// connect to database
common_1.DataAccess.connect({ connectionString: process.env.MONGODB_URI }).then(db => {
    // let coll = db.collection("EntityType1");
    // // coll.createIndexes([{ key: { "created_by.name": 1 }, unique: true }]).then(res => {
    // coll.indexes().then(idxs => {
    //   console.log(idxs);
    // });
    // // });
});
// Start server
Server.init();
//# sourceMappingURL=index.js.map