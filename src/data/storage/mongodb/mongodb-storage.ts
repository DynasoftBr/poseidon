import { Db, MongoClient } from "mongodb";
import { MongoDbStorageCollection } from "./mongodb-storage-collection";
import { MongoDbStorageConnectionOptions } from "./mongodb-storage-connection-options";
import { IDataStorage, IStorageCollection } from "..";
import { SysMsgs } from "../../../exceptions";
import { IEntity } from "@poseidon/core-models";
import { logger } from "../../../logger";

export class MongoDbStorage implements IDataStorage {
  private mongoClient: MongoClient;
  private db: Db;
  public connected: boolean = false;
  async connect(connetionOptions: MongoDbStorageConnectionOptions): Promise<void> {
    let retries = 0;
    connetionOptions.retries = connetionOptions.retries || 0;
    while (retries <= connetionOptions.retries && this.connected === false) {
      try {
        this.mongoClient = await MongoClient.connect(connetionOptions.url, { useUnifiedTopology: true });
        this.setDatabase(connetionOptions.dbName);

        this.connected = true;

        logger.info(SysMsgs.info.connectedToDatabase.message);
      } catch (err) {
        if (retries < connetionOptions.retries) {
          // Retry for configurated times.
          retries++;

          // log a warn.
          logger.warn(SysMsgs.format(SysMsgs.info.cannotConnectToDatabase, connetionOptions.timeBetweenRetries));

          // After configurated time retry connect to database.
          const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
          await delay(connetionOptions.timeBetweenRetries * 1000);
        } else {
          throw err;
        }
      }
    }
  }

  setDatabase(name: string) {
    this.db = this.mongoClient.db(name);
  }

  collection<T extends IEntity = IEntity>(name: string): IStorageCollection<T> {
    return new MongoDbStorageCollection(this.db, name);
  }
}
