import { Db } from "mongodb";
import * as Data from "./";
export declare class DataConnection {
    database: Db;
    private retrys;
    private _instance;
    /**
     * Opens database connection.
     */
    connect(config: Data.MongoDbConfiguration, retry?: boolean): void;
}
export declare let DataAccess: DataConnection;
