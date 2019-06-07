"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const concrete_entity_service_1 = require("./concrete-entity-service");
const core_models_1 = require("@poseidon/core-models");
const exceptions_1 = require("../exceptions");
class EntityTypeService extends concrete_entity_service_1.ConcreteEntityService {
    constructor(repo, repoFactory) {
        super(repo, repoFactory);
    }
    buildPipelines() {
    }
    validatePatternProperties(entity) {
        const problems = [];
        const props = entity.props;
        for (let idx = 0; idx < props.length; idx++) {
            const prop = props[idx];
            problems.push(...this.validatePattern(prop.name, prop.validation));
        }
        return problems;
    }
    validatePattern(propName, validation) {
        const problems = [];
        if (validation.type === core_models_1.PropertyTypes.string
            && validation.pattern) {
            try {
                new RegExp(validation.pattern);
            }
            catch (e) {
                problems.push(new exceptions_1.ValidationProblem(propName, core_models_1.ProblemKeywords.pattern, exceptions_1.SysMsgs.validation.invalidPattern));
            }
        }
        else if (validation.type === core_models_1.PropertyTypes.array
            && validation.items.type === core_models_1.PropertyTypes.string
            && validation.items.pattern) {
            problems.push(...this.validatePattern(propName, validation));
        }
        return problems;
    }
}
exports.EntityTypeService = EntityTypeService;
//# sourceMappingURL=entity-type-service.js.map