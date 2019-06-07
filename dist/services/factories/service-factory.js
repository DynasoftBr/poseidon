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
const core_models_1 = require("@poseidon/core-models");
const concrete_entity_service_1 = require("../concrete-entity-service");
const entity_type_service_1 = require("../entity-type-service");
class ServiceFactory {
    constructor(repoFactory) {
        this.repoFactory = repoFactory;
        this.services = new Map();
    }
    getByName(entityTypeName) {
        return __awaiter(this, void 0, void 0, function* () {
            // try to find an existent instance, and return it.
            let service = this.services.get(entityTypeName);
            if (service)
                return service;
            // As there is no instance for this entity type yet, create one and store it on cache.
            service = yield this.createServiceByName(entityTypeName);
            this.services.set(entityTypeName, service);
            return service;
        });
    }
    createServiceByName(entityTypeName) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (entityTypeName) {
                case core_models_1.SysEntities.entityType:
                    return this.createEntityTypeService();
                default:
                    return this.createDefaultService(entityTypeName);
            }
        });
    }
    createDefaultService(entityTypeName) {
        return __awaiter(this, void 0, void 0, function* () {
            const entityRepo = yield this.repoFactory.createByName(entityTypeName);
            return new concrete_entity_service_1.ConcreteEntityService(entityRepo, this.repoFactory);
        });
    }
    createEntityTypeService() {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = yield this.repoFactory.entityType();
            return new entity_type_service_1.EntityTypeService(repo, this.repoFactory);
        });
    }
}
exports.ServiceFactory = ServiceFactory;
//# sourceMappingURL=service-factory.js.map