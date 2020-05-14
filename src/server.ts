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
import { IDataStorage } from "./data";
import { SysMsgs } from "./exceptions";
import { env } from "./env.config";

// Middlewares
import { unhandledException } from "./middlewares/exception-middleware";
import { PostgresStorage } from "./data/storage/postgres/postgres-storage";

export async function init(): Promise<void> {
  // Connect to the storage.
  const storage = new PostgresStorage(env.storage);
  try {
    await storage.testConnection();
    // storage.feed();

    initApp(storage);
  } catch (error) {
    logger.error(error);
    process.exit(SysMsgs.error.databaseLevelError.code);
  }
}

function initApp(storage: IDataStorage) {
  /**
   * Create Express server.
   */
  const app = new Koa();
  const cors = require("@koa/cors");

  /**
   * Express configuration.
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
