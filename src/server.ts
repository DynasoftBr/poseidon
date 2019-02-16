/**
 * Module dependencies.
 */
import * as winston from "winston";
import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as errorHandler from "errorhandler";
import { Env } from "./env";
import * as cors from "cors";

import {
  DatabaseError, SysMsgs, RepositoryFactory,
  DataStorage, ServiceFactory, DatabasePopulator, MongoDbStorage,
} from "@poseidon/engine";

// APIs
import { ApiV1 } from "./v1/api-v1";

// Middlewares
import { customLogger, mqueryParser } from "./middlewares";

export async function init(): Promise<void> {

  const env = <Env><any>process.env;
  // Connect to the storage.
  const storage = new MongoDbStorage();
  try {
    // await storage.connect();

    await storage.connect({
      dbName: env.DB_NAME,
      retries: Number.parseInt(env.RETRIES),
      timeBetweenRetries: Number.parseInt(env.TIME_BETWEEN_RETRIES),
      url: env.MONGODB_URI
    });

    const populator = new DatabasePopulator(storage);
    // await populator.populate();

    initApp(storage);
  } catch (error) {
    winston.error(error);
    process.exit(SysMsgs.error.databaseLevelError.code);
  }


  // connect to database
  // await DataAccess.connect({
  //   url: process.env.MONGODB_URI,
  //   dbName: process.env.DB_NAME,
  //   retries: parseInt(process.env.RETRIES),
  //   timeBetweenRetries: parseInt(process.env.TIME_BETWEEN_RETRIES)
  // }).then(db => {
  //   // let coll = db.collection("EntityType1");
  //   // // coll.createIndexes([{ key: { "created_by.name": 1 }, unique: true }]).then(res => {
  //   // coll.indexes().then(idxs => {
  //   //   console.log(idxs);
  //   // });
  //   // // });



  // }).catch(err => {
  //   winston.error(new DatabaseError(SysMsgs.error.databaseLevelError, err).message);
  //   process.exit(SysMsgs.error.databaseLevelError.code);
  // });

}


function initApp(storage: DataStorage) {
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
  app.use(cors()); // Enable all cors requests.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(customLogger);

  // Parses querystring parameter 'query' to an object.
  app.use(mqueryParser);

  // API Router
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Instantiate the repositories and services factory.
  const repoFactory = new RepositoryFactory(storage);
  const servicesFactory = new ServiceFactory(repoFactory);

  // API V1
  ApiV1.init(apiRouter, servicesFactory);

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