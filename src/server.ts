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
import { InMemoryStorage, DatabasePopulator, IDataStorage, RepositoryFactory } from "./data";
import { ServiceFactory } from "./services";
import { SysMsgs } from "./exceptions";
import { env } from "./env.config";

// Middlewares
import { unhandledException } from "./middlewares/exception-middleware";

export async function init(): Promise<void> {

  // Connect to the storage.
  let storage = new InMemoryStorage();
  try {
    await storage.connect();

    const populator = new DatabasePopulator(storage);
    await populator.populate();

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

  /**
   * Express configuration.
   */
  app.use(koaLogger());
  app.use(compress());
  app.use(bodyParser({ enableTypes: ["json"] }));
  app.use(unhandledException());

  // Instantiate the repositories and services factory.
  const repoFactory = new RepositoryFactory(storage);
  const servicesFactory = new ServiceFactory(repoFactory);

  // API V1
  app.use(ApiV1.getRouter(servicesFactory).routes());

  /**
   * Start Express server.
   */
  const server = app.listen(Number(env.port) | 3000, () => {
    const address = server.address() as AddressInfo;
    logger.info(("App is running at http://localhost:%d in %s mode"), address.port);
    logger.info("Press CTRL-C to stop\n");
  });

  return server;
}