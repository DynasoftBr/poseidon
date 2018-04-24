/**
 * Module dependencies.
 */
import winston = require("winston");
import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import * as path from "path";
import * as dotenv from "dotenv";

// APIs
import { ApiV1 } from "./v1/api-v1";

// Middlewares
import { customLogger, mqueryParser } from "./middlewares";

export async function init(): Promise<express.Express> {

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

  app.use(customLogger);

  // Parses query parameter 'query' to an object.
  app.use(mqueryParser);

  // API Router
  let apiRouter = express.Router();
  app.use("/api", apiRouter);

  // API V1
  ApiV1.init(apiRouter);

  /**
   * Error Handler. Provides full stack - remove for production
   */
  app.use(errorHandler());

  /**
   * Start Express server.
   */

  app.listen(app.get("port"), () => {
    console.log(("App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
    console.log("Press CTRL-C to stop\n");
  });

  return app;
}