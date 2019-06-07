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
const command_pipeline_1 = require("../pipelines/command/command-pipeline");
const publish_domain_event_1 = require("../pipelines/command/common/publish-domain-event");
const apply_defaults_and_convention_1 = require("../pipelines/command/common/apply-defaults-and-convention");
const validate_schema_1 = require("../pipelines/command/common/validate-schema");
class ConcreteEntityService {
    constructor(repo, repoFactory) {
        this.repo = repo;
        this.repoFactory = repoFactory;
        this.entityType = repo.entityType;
        this.buildPipelines();
    }
    findMany(filter, skip, limit, sort) {
        throw new Error("Method not implemented.");
    }
    findOne(filter) {
        throw new Error("Method not implemented.");
    }
    create(partialEntity, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                entity: partialEntity,
                entityType: this.entityType,
                operation: "insert",
                context: null,
                eventName: event || `${this.entityType.name}_created`
            };
            yield this.createPipeline.handle(request);
            return request.entity;
        });
    }
    update(partialEntity, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                entity: partialEntity,
                entityType: this.entityType,
                operation: "update",
                context: null,
                eventName: event || `${this.entityType.name}_updated`
            };
            yield this.updatePipeline.handle(request);
            return partialEntity;
        });
    }
    delete(id, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                entity: { _id: id },
                entityType: this.entityType,
                operation: "delete",
                context: null,
                eventName: event || `${this.entityType.name}_deleted`
            };
            return this.deletePipeline.handle(request);
        });
    }
    executeCommand(command, params) {
        throw new Error("Method not implemented.");
    }
    buildPipelines() {
        const createHandlers = [
            apply_defaults_and_convention_1.applyDefaultsAndConvention,
            validate_schema_1.validateSchema,
            publish_domain_event_1.publishDomainEvent
        ];
        this.createPipeline = new command_pipeline_1.CommandPipeline(createHandlers);
        const updateHandlers = [
            apply_defaults_and_convention_1.applyDefaultsAndConvention,
            validate_schema_1.validateSchema,
            publish_domain_event_1.publishDomainEvent
        ];
        this.updatePipeline = new command_pipeline_1.CommandPipeline(updateHandlers);
        const deleteHandlers = [
            publish_domain_event_1.publishDomainEvent
        ];
        this.deletePipeline = new command_pipeline_1.CommandPipeline(deleteHandlers);
    }
}
exports.ConcreteEntityService = ConcreteEntityService;
//# sourceMappingURL=concrete-entity-service.js.map