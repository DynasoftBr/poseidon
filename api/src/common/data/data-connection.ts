import { Db, MongoClient } from "mongodb";
import winston = require("winston"); // Logger. Uses configuration made in server.ts.

import { SysError, SysMsgs } from "../";
import * as Data from "./";

export class DataConnection {
    database: Db;
    private retrys = 0;
    private _instance: DataConnection;
    /**
     * Opens database connection.
     */
    connect(config: Data.MongoDbConfiguration, retry: boolean = false): Promise<Db> {
        return new Promise<Db>((resolve, reject) => {
            if (retry)
                winston.info(SysMsgs.format(SysMsgs.info.tryingConnectToDatabaseAgain));

            MongoClient.connect(config.connectionString).then(db => {
                this.database = db;

                winston.info(SysMsgs.info.connectedToDatabase.message);

                resolve(db);
            }).catch((err) => {
                let error = new Data.DatabaseError(err);
                winston.error(error.message, error);

                if (this.retrys <= 5) {
                    this.retrys++;

                    winston.info(SysMsgs.format(SysMsgs.info.cannotConnectToDatabase, 30));
                    setTimeout(() => {
                        this.connect(config, true).then(db => {
                            resolve(db);
                        }).catch(err => {
                            reject(err);
                        });
                    }, 30000);
                } else {
                    reject(error);
                }
            });
        });

    }
}

export const DataAccess = new DataConnection();