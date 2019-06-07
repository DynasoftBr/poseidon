"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const env_config_1 = require("./env.config");
const Server = require("./server");
logger_1.logger.info(`Running enviroment ${env_config_1.env.nodeEnv}`);
Server.init();
//# sourceMappingURL=index.js.map