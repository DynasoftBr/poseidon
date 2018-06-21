import winston = require("winston"); // Logger. Uses configuration made in server.ts.

import { DataStorage } from "../data-storage";
import { StorageCollection } from "../storage-collection";
import { InMemoryStorageCollection } from "./in-memory-storage-collection";
import { SysMsgs } from "../../..";
import { ConcreteEntity } from "../../../models";
import * as LokiDb from "lokijs";

export class InMemoryStorage implements DataStorage {

    private db: LokiDb;
    public connected: boolean;
    async connect(): Promise<boolean> {
        this.db = new LokiDb("in-memory-data-storage.json");

        return true;
    }

    setDatabase(name: string) {
        this.db = new LokiDb(`${name}.json`);
    }

    collection<T extends ConcreteEntity>(name: string): StorageCollection<T> {
        return new InMemoryStorageCollection<T>(this.db, name);
    }
}