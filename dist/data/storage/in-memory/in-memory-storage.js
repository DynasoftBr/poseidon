"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const in_memory_storage_collection_1 = require("./in-memory-storage-collection");
const LokiDb = require("lokijs");
class InMemoryStorage {
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = new LokiDb("in-memory-data-storage.json");
        });
    }
    setDatabase(name) {
        this.db = new LokiDb(`${name}.json`);
    }
    collection(name) {
        return new in_memory_storage_collection_1.InMemoryStorageCollection(this.db, name);
    }
}
exports.InMemoryStorage = InMemoryStorage;
//# sourceMappingURL=in-memory-storage.js.map