/**
 * Module dependencies.
 */
import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import * as dotenv from "dotenv";
import * as path from "path";
import winston = require("winston");

import { ApiRouter } from "./api/";

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: __dirname + "/../.env" });

/**
 * Config logger.
 */
// winston.level = process.env.LOG_LEVEL;
winston.configure({
  transports: [
    new (winston.transports.File)({ filename: "somefile.log" })
  ]
});
winston.info("Agora foi");

/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);

app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API v1
app.use("/api", ApiRouter());

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;