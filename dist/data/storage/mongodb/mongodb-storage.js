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
const mongodb_1 = require("mongodb");
const mongodb_storage_collection_1 = require("./mongodb-storage-collection");
const exceptions_1 = require("../../../exceptions");
const logger_1 = require("../../../logger");
class MongoDbStorage {
    connect(connetionOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let retries = 0;
            while (retries <= connetionOptions.retries && this.connected === false) {
                try {
                    this.mongoClient = yield mongodb_1.MongoClient.connect(connetionOptions.url);
                    this.setDatabase(connetionOptions.dbName);
                    logger_1.logger.info(exceptions_1.SysMsgs.info.connectedToDatabase.message);
                }
                catch (err) {
                    // Retry for configurated times.
                    retries++;
                    // log a warn.
                    logger_1.logger.warn(exceptions_1.SysMsgs.format(exceptions_1.SysMsgs.info.cannotConnectToDatabase, connetionOptions.timeBetweenRetries));
                    // After configurated time retry connect to database.
                    const delay = (ms) => new Promise(res => setTimeout(res, ms));
                    yield delay(connetionOptions.timeBetweenRetries * 1000);
                }
            }
        });
    }
    setDatabase(name) {
        this.db = this.mongoClient.db(name);
    }
    collection(name) {
        return new mongodb_storage_collection_1.MongoDbStorageCollection(this.db, name);
    }
}
exports.MongoDbStorage = MongoDbStorage;
//# sourceMappingURL=mongodb-storage.js.map