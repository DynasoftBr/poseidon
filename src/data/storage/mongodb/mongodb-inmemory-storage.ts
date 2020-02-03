import { MongoDbStorageConnectionOptions } from "./mongodb-storage-connection-options";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoDbStorage } from "./mongodb-storage";

export class MongoDbInMemoryStorage extends MongoDbStorage {
  async connect(connetionOptions: MongoDbStorageConnectionOptions): Promise<void> {
    const mongod = await MongoMemoryServer.create();
    const uri = await mongod.getUri(connetionOptions.dbName);

    return super.connect({ ...connetionOptions, url: uri });
  }
}
