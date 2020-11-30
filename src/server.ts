/**
 * Module dependencies.
 */
import { logger } from "./logger";

import * as Koa from "koa";
import * as compress from "koa-compress";
import * as bodyParser from "koa-bodyparser";
import * as koaLogger from "koa-logger";

// APIs
import { ApiV1 } from "./v1/api-v1";

import { AddressInfo } from "net";
import { DataStorage } from "./data";
import { SysMsgs } from "./exceptions";
import { env } from "./env.config";

// Middlewares
import { unhandledException } from "./middlewares/exception-middleware";
import { MongoDbStorage } from "./data/storage/mongodb/mongodb-storage";
import { LocalProcessCache } from "./data/cache/local-process-cache";

export async function init(): Promise<void> {
  const cache = new LocalProcessCache();

  // Connect to the storage.
  const storage: DataStorage = await MongoDbStorage.init({ dbName: env.storage.db, url: env.storage.host }, cache);

  try {
    // storage.feed();

    initApp(storage);
  } catch (error) {
    logger.error(error);
    process.exit(SysMsgs.error.databaseLevelError.code);
  }
}

function initApp(storage: DataStorage) {
  /**
   * Create Express server.
   */
  const app = new Koa();
  const cors = require("@koa/cors");

  /**
   * Koa configuration.
   */
  app.use(koaLogger());
  app.use(compress());
  app.use(bodyParser({ enableTypes: ["json"] }));
  app.use(unhandledException());
  app.use(cors());

  // API V1
  app.use(ApiV1.getRouter(storage).routes());

  /**
   * Start server.
   */
  const server = app.listen(env.port || 3000, () => {
    const address = server.address() as AddressInfo;
    logger.info(`App is running at http://localhost:${address.port} in ${env.nodeEnv} mode.`);
    logger.info("Press CTRL-C to stop\n");
  });

  return server;
}
