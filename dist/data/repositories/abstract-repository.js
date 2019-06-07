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
const exceptions_1 = require("../../exceptions");
const mongodb_1 = require("mongodb");
const events_1 = require("events");
class AbstractRepository extends events_1.EventEmitter {
    constructor(collection, storage, entityType) {
        super();
        this.collection = collection;
        this.storage = storage;
        this.entityType = entityType;
    }
    deleteOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.deleteOne(id);
        });
    }
    updateOne(id, entity) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.updateOne(id, entity);
        });
    }
    insertOne(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.insertOne(entity);
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOne({ _id: id });
        });
    }
    findMany(filter, skip, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findMany(filter, skip, limit);
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOne(filter);
        });
    }
    handleError(error) {
        if (error instanceof mongodb_1.MongoError)
            throw new exceptions_1.DatabaseError(exceptions_1.SysMsgs.error.databaseLevelError, error);
        throw error;
    }
}
exports.AbstractRepository = AbstractRepository;
//# sourceMappingURL=abstract-repository.js.map