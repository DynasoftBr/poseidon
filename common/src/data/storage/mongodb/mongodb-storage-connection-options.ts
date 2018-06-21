import { StorageConnectionOptions } from "../storage-connection-options";

export interface MongoDbStorageConnectionOptions extends StorageConnectionOptions {
    url: string;
    dbName: string;
}