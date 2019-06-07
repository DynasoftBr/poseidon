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
const abstract_repository_1 = require("./abstract-repository");
const core_models_1 = require("@poseidon/core-models");
class EntityTypeRepository extends abstract_repository_1.AbstractRepository {
    constructor(storage, entityType) {
        super(storage.collection(core_models_1.SysEntities.entityType), storage, entityType);
        this.cacheByName = new Map();
        this.cacheById = new Map();
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fist try to get from cache.
            const cache = this.cacheById.get(id);
            if (cache != null)
                return cache;
            // If we could not find it on the cache, try find on the storage and than add it to the cache.
            const result = yield this.collection.findOne({ _id: id });
            if (result != null) {
                this.cacheByName.set(result.name, result);
                this.cacheById.set(id, result);
            }
            return result;
        });
    }
    findByName(entityTypeName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fist try to get from cache.
            const cache = this.cacheByName.get(entityTypeName);
            if (cache != null)
                return cache;
            // If we could not find it on the cache, try find on the storage and than add it to the cache.
            const result = yield this.collection.findOne({ name: entityTypeName });
            if (result != null) {
                this.cacheByName.set(entityTypeName, result);
                this.cacheById.set(result._id, result);
            }
            return result;
        });
    }
}
exports.EntityTypeRepository = EntityTypeRepository;
//# sourceMappingURL=entity-type-repository.js.map