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
const entity_type_repository_1 = require("../entity-type-repository");
const concrete_entity_repository_1 = require("../concrete-entity-repository");
const core_models_1 = require("@poseidon/core-models");
const exceptions_1 = require("../../../exceptions");
class RepositoryFactory {
    constructor(storage) {
        this.storage = storage;
        this.repositories = new Map();
    }
    createByName(entityTypeName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entityTypeName === core_models_1.SysEntities.entityType)
                return yield this.entityType();
            // try to find an existent instance, and return it.
            let repo = this.repositories.get(entityTypeName);
            if (repo)
                return repo;
            // As there is no repository instance for this entity type yet, create one and store it on cache.
            repo = yield this.createConcreteEntityRepository(entityTypeName);
            this.repositories.set(entityTypeName, repo);
            return repo;
        });
    }
    createConcreteEntityRepository(entityTypeName) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityTypeRepo = yield this.entityType();
            const entityType = yield entityTypeRepo.findByName(entityTypeName);
            if (entityType == null)
                throw new exceptions_1.DatabaseError(exceptions_1.SysMsgs.error.entityTypeNotFound, entityTypeName);
            if (entityType.abstract === true)
                throw new exceptions_1.DatabaseError(exceptions_1.SysMsgs.error.abstractEntityType, entityTypeName);
            return new concrete_entity_repository_1.ConcreteEntityRepository(this.storage, entityType);
        });
    }
    entityType() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.entityTypeRepo != null)
                return this.entityTypeRepo;
            const entityType = yield this.storage.collection(core_models_1.SysEntities.entityType)
                .findOne({ name: core_models_1.SysEntities.entityType });
            return this.entityTypeRepo = new entity_type_repository_1.EntityTypeRepository(this.storage, entityType);
        });
    }
}
exports.RepositoryFactory = RepositoryFactory;
//# sourceMappingURL=repository-factory.js.map