import { Db, MongoClient } from "mongodb";
import winston = require("winston"); // Logger. Uses configuration made in server.ts.

import { SysError, SysMsgs, DatabaseError } from "../";
import * as Data from "./";
import { resolve } from "path";

class DataConnection implements IDataConnection {
    database: Db;
    private retrys = 0;
    private _instance: DataConnection;
    /**
     * Opens database connection.
     */
    async connect(config: Data.MongoDbConfiguration, retry: boolean = false) {

        if (retry)
            winston.info(SysMsgs.format(SysMsgs.info.tryingConnectToDatabaseAgain));

        try {
            let client = await MongoClient.connect(config.url);

            winston.info(SysMsgs.info.connectedToDatabase.message);

            return this.database = client.db(config.dbName);
        } catch (err) {
            // Retry for configurated times.
            if (this.retrys < config.retries) {
                this.retrys++;

                // log a warn.
                winston.warn(SysMsgs.format(SysMsgs.info.cannotConnectToDatabase, config.timeBetweenRetries));

                // After configurated time retry connect to database.
                const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
                await delay(config.timeBetweenRetries * 1000);

                await this.connect(config, true);
            } else {
                throw err;
            }
        }
    }
}

export interface IDataConnection {
    database: Db;
    connect(config: Data.MongoDbConfiguration, retry?: boolean): Promise<Db>;
}

export let DataAccess: IDataConnection = new DataConnection();