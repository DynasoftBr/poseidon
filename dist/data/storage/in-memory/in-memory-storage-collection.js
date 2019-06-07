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
const _ = require("lodash");
class InMemoryStorageCollection {
    constructor(db, collectionName) {
        this.db = db;
        this.collection = db.getCollection(collectionName);
        if (this.collection == null)
            this.collection = db.addCollection(collectionName);
    }
    ensureIndex(indexName, field, unique) {
        throw new Error("Method not implemented.");
    }
    dropIndex(indexName) {
        throw new Error("Method not implemented.");
    }
    drop() {
        throw new Error("Method not implemented.");
    }
    findMany(filter, skip, limit, sort) {
        return __awaiter(this, void 0, void 0, function* () {
            const clone = _.cloneDeep(yield this.collection.find(filter));
            delete (clone.$loki);
            delete (clone.meta);
            return clone;
        });
    }
    findOne(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clone = _.cloneDeep(yield this.collection.findOne(filter));
                delete (clone.$loki);
                delete (clone.meta);
                return clone;
            }
            catch (error) {
                /// this.handleError(error);
            }
        });
    }
    insertOne(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clone = _.cloneDeep(doc);
                const result = yield this.collection.insertOne(clone);
                return result != null;
            }
            catch (error) {
                /// this.handleError(error);
            }
        });
    }
    deleteOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.collection.removeWhere(et => et._id == id);
                return true;
            }
            catch (error) {
                /// this.handleError(error);
            }
        });
    }
    updateOne(id, updateObj) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.collection.updateWhere(et => et._id == id, (oldEntity) => {
                    _.assignIn(oldEntity, updateObj);
                });
                return true;
            }
            catch (error) {
                /// this.handleError(error);
            }
        });
    }
}
exports.InMemoryStorageCollection = InMemoryStorageCollection;
//# sourceMappingURL=in-memory-storage-collection.js.map