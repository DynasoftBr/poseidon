import { IStorageConnectionOptions } from "../istorage-connection-options";

export interface MongoDbStorageConnectionOptions extends IStorageConnectionOptions {
    url: string;
    dbName: string;
}