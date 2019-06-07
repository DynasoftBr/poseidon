import { Db, MongoClient } from "mongodb";
import { MongoDbStorageCollection } from "./mongodb-storage-collection";
import { MongoDbStorageConnectionOptions } from "./mongodb-storage-connection-options";
import { IDataStorage, IStorageCollection } from "..";
import { SysMsgs } from "../../../exceptions";
import { IConcreteEntity } from "@poseidon/core-models";
import { logger } from "../../../logger";

export class MongoDbStorage implements IDataStorage {

    private mongoClient: MongoClient;
    private db: Db;
    public connected: boolean;
    async connect(connetionOptions: MongoDbStorageConnectionOptions): Promise<void> {

        let retries = 0;
        while (retries <= connetionOptions.retries && this.connected === false) {

            try {
                this.mongoClient = await MongoClient.connect(connetionOptions.url);
                this.setDatabase(connetionOptions.dbName);

                logger.info(SysMsgs.info.connectedToDatabase.message);
            } catch (err) {
                // Retry for configurated times.
                retries++;

                // log a warn.
                logger.warn(SysMsgs.format(SysMsgs.info.cannotConnectToDatabase, connetionOptions.timeBetweenRetries));

                // After configurated time retry connect to database.
                const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
                await delay(connetionOptions.timeBetweenRetries * 1000);
            }
        }
    }

    setDatabase(name: string) {
        this.db = this.mongoClient.db(name);
    }

    collection<T extends IConcreteEntity = IConcreteEntity>(name: string): IStorageCollection<T> {
        return new MongoDbStorageCollection(this.db, name);
    }
}