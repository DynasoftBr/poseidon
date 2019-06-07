import { logger } from "./logger";
import { env } from "./env.config";
import * as Server from "./server";

logger.info(`Running enviroment ${env.nodeEnv}`);

Server.init();