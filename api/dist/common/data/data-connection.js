"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const winston = require("winston"); // Logger. Uses configuration made in server.ts.
const _1 = require("../");
const Data = require("./");
class DataConnection {
    constructor() {
        this.retrys = 0;
    }
    /**
     * Opens database connection.
     */
    connect(config, retry = false) {
        return new Promise((resolve, reject) => {
            if (retry)
                winston.info(_1.SysMsgs.format(_1.SysMsgs.info.tryingConnectToDatabaseAgain));
            mongodb_1.MongoClient.connect(config.connectionString).then(db => {
                this.database = db;
                winston.info(_1.SysMsgs.info.connectedToDatabase.message);
                resolve(db);
            }).catch((err) => {
                let error = new Data.DatabaseError(err);
                winston.error(error.message, error);
                if (this.retrys <= 5) {
                    this.retrys++;
                    winston.info(_1.SysMsgs.format(_1.SysMsgs.info.cannotConnectToDatabase, 30));
                    setTimeout(() => {
                        this.connect(config, true).then(db => {
                            resolve(db);
                        }).catch(err => {
                            reject(err);
                        });
                    }, 30000);
                }
                else {
                    reject(error);
                }
            });
        });
    }
}
exports.DataConnection = DataConnection;
exports.DataAccess = new DataConnection();
//# sourceMappingURL=data-connection.js.map