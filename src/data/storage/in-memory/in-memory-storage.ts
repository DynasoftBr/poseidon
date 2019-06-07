import { IDataStorage } from "../idata-storage";
import { IStorageCollection } from "../istorage-collection";
import { InMemoryStorageCollection } from "./in-memory-storage-collection";
import * as LokiDb from "lokijs";
import { IConcreteEntity } from "@poseidon/core-models";

export class InMemoryStorage implements IDataStorage {

    private db: LokiDb;
    public connected: boolean;
    async connect(): Promise<void> {
        this.db = new LokiDb("in-memory-data-storage.json");
    }

    setDatabase(name: string) {
        this.db = new LokiDb(`${name}.json`);
    }

    collection<T extends IConcreteEntity>(name: string): IStorageCollection<T> {
        return new InMemoryStorageCollection<T>(this.db, name);
    }
}