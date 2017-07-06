import { Db, MongoClient } from "mongodb";
import winston = require("winston"); // Logger. Uses configuration made in server.ts.

import { SysMsgs, SysError, DatabaseError } from "../exceptions";

class DataConnection {
    database: Db;

    /**
     * Opens database connection.
     */
    connect(): DataConnection {
        MongoClient.connect(process.env.MONGODB_URI).then(db => {
            this.database = db;

            winston.info(SysMsgs.info.connectedToDatabase.message);

        }).catch((err) => {
            let error = DatabaseError.databaseConnectionFailed(err);
            winston.error(error.message, error);
        });

        return this;
    }
}

// Start connection with the api boot.
export let DataAccess = new DataConnection();