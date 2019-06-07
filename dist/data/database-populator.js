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
const built_in_entries_1 = require("./built-in-entries");
const core_models_1 = require("@poseidon/core-models");
class DatabasePopulator {
    constructor(storage) {
        this.storage = storage;
    }
    populate() {
        return __awaiter(this, void 0, void 0, function* () {
            const buildInEntities = new built_in_entries_1.BuiltInEntries();
            const entityTypeCollection = this.storage.collection(core_models_1.SysEntities.entityType);
            entityTypeCollection.insertOne(buildInEntities.entityType);
            entityTypeCollection.insertOne(buildInEntities.entityTypeEntityProperty);
            entityTypeCollection.insertOne(buildInEntities.entityTypeEntitySchema);
            entityTypeCollection.insertOne(buildInEntities.entityTypeUser);
            entityTypeCollection.insertOne(buildInEntities.entityTypeValidation);
            entityTypeCollection.insertOne(buildInEntities.entityTypeLinkedProperty);
            const userCollection = this.storage.collection(core_models_1.SysEntities.user);
            userCollection.insertOne(buildInEntities.rootUser);
        });
    }
}
exports.DatabasePopulator = DatabasePopulator;
//# sourceMappingURL=database-populator.js.map