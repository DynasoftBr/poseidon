"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies.
 */
const logger_1 = require("./logger");
const Koa = require("koa");
const compress = require("koa-compress");
const bodyParser = require("koa-bodyparser");
const koaLogger = require("koa-logger");
// APIs
const api_v1_1 = require("./v1/api-v1");
const data_1 = require("./data");
const services_1 = require("./services");
const exceptions_1 = require("./exceptions");
const env_config_1 = require("./env.config");
// Middlewares
const exception_middleware_1 = require("./middlewares/exception-middleware");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        // Connect to the storage.
        let storage = new data_1.InMemoryStorage();
        try {
            yield storage.connect();
            const populator = new data_1.DatabasePopulator(storage);
            yield populator.populate();
            initApp(storage);
        }
        catch (error) {
            logger_1.logger.error(error);
            process.exit(exceptions_1.SysMsgs.error.databaseLevelError.code);
        }
    });
}
exports.init = init;
function initApp(storage) {
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
    app.use(exception_middleware_1.unhandledException());
    // Instantiate the repositories and services factory.
    const repoFactory = new data_1.RepositoryFactory(storage);
    const servicesFactory = new services_1.ServiceFactory(repoFactory);
    // API V1
    app.use(api_v1_1.ApiV1.getRouter(servicesFactory).routes());
    /**
     * Start Express server.
     */
    const server = app.listen(Number(env_config_1.env.port) | 3000, () => {
        const address = server.address();
        logger_1.logger.info(("App is running at http://localhost:%d in %s mode"), address.port);
        logger_1.logger.info("Press CTRL-C to stop\n");
    });
    return server;
}
//# sourceMappingURL=server.js.map