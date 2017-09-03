"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const compression = require("compression"); // compresses requests
const bodyParser = require("body-parser");
const logger = require("morgan");
const errorHandler = require("errorhandler");
const api_v1_1 = require("./v1/api-v1");
function init() {
    return new Promise((resolve) => {
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
        // API Router
        let apiRouter = express.Router();
        app.use("/api", apiRouter);
        // API V1
        api_v1_1.ApiV1.init(apiRouter);
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
            resolve(app);
        });
    });
}
exports.init = init;
//# sourceMappingURL=server.js.map