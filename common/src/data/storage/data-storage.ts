import { StorageCollection } from "./storage-collection";
import { StorageConnectionOptions } from "./storage-connection-options";
import { ConcreteEntity } from "../../models";

export interface DataStorage {
    connect(config: StorageConnectionOptions): Promise<boolean>;
    setDatabase(name: string): void;
    collection<T extends ConcreteEntity = ConcreteEntity>(collectionName: string): StorageCollection<T>;
}