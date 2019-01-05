import winston from "winston"; // Logger. Uses configuration made in server.ts.

import { DataStorage } from "../data-storage";
import { StorageCollection } from "../storage-collection";
import { Db, MongoClient } from "mongodb";
import { MongoDbStorageCollection } from "./mongodb-storage-collection";
import { MongoDbStorageConnectionOptions } from "./mongodb-storage-connection-options";
import { SysMsgs } from "../../..";
import { ConcreteEntity } from "../../../models";

export class MongoDbStorage implements DataStorage {

    private mongoClient: MongoClient;
    private db: Db;
    public connected: boolean = false;
    async connect(connetionOptions: MongoDbStorageConnectionOptions): Promise<boolean> {

        let retries = 0;
        while (retries <= connetionOptions.retries && this.connected === false) {

            try {
                this.mongoClient = await MongoClient.connect(connetionOptions.url);
                this.setDatabase(connetionOptions.dbName);

                winston.info(SysMsgs.info.connectedToDatabase.message);

                return this.connected = true;
            } catch (err) {
                // Retry for configurated times.
                retries++;

                // log a warn.
                winston.warn(SysMsgs.format(SysMsgs.info.cannotConnectToDatabase, connetionOptions.timeBetweenRetries));

                // After configurated time retry connect to database.
                const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
                await delay(connetionOptions.timeBetweenRetries * 1000);
            }
        }
    }

    setDatabase(name: string) {
        this.db = this.mongoClient.db(name);
    }

    collection<T extends ConcreteEntity = ConcreteEntity>(name: string): StorageCollection<T> {
        return new MongoDbStorageCollection(this.db, name);
    }
}