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
    connect(config: Data.MongoDbConfiguration, retry: boolean = false) {
        if (retry)
            winston.info(SysMsgs.format(SysMsgs.info.tryingConnectToDatabaseAgain));

        MongoClient.connect(config.connectionString).then(db => {
            this.database = db;

            winston.info(SysMsgs.info.connectedToDatabase.message);

        }).catch((err) => {
            let error = new Data.DatabaseError(err);
            winston.error(error.message, error);

            if (this.retrys <= 5) {
                this.retrys++;

                winston.info(SysMsgs.format(SysMsgs.info.cannotConnectToDatabase, 30));
                setTimeout(() => {
                    this.connect(config, true);
                }, 30000);
            }
        });
    }
}

export let DataAccess = new DataConnection();