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
const Ajv = require("ajv");
const _ = require("lodash");
const entity_schema_builder_1 = require("../../schema-builder/entity-schema-builder");
const core_models_1 = require("@poseidon/core-models");
const exceptions_1 = require("../..//exceptions");
class EntityValidator {
    /**
     * Validates an entity against it's schema.
     * @param entitytype The entity type of the entity to be validated.
     * @param entity The entity to be validated.
     */
    static validate(entitytype, entity, repoFactory) {
        return __awaiter(this, void 0, void 0, function* () {
            let problems;
            const schemaRepo = yield repoFactory.createByName(core_models_1.SysEntities.entitySchema);
            const entitySchema = yield schemaRepo.findById(entitytype._id);
            let schema;
            // If can't find the schema on database, try to build it.
            if (entitySchema != null)
                schema = JSON.parse(entitySchema.schema);
            else
                schema = (yield new entity_schema_builder_1.EntitySchemaBuilder(yield repoFactory.entityType())
                    .buildSchema(entitytype)).getSchema();
            // Get schema problems.
            problems = this.validateAgainstJsonSchema(schema, entity);
            // Get linked entity problems.
            problems.push(...yield this.validateLinkedEntities(entitytype, entity, repoFactory));
            return problems;
        });
    }
    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    static validateAgainstJsonSchema(schema, entity) {
        // Instantiates ajv library, compiles the schema, them validates the entity.
        const jsonVal = new Ajv({ allErrors: true, verbose: true });
        const validate = jsonVal.compile(schema);
        const valid = validate(entity);
        // If the obj is valid just return an empty array.
        if (valid)
            return [];
        // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
        const problems = new Array(validate.errors.length);
        validate.errors.forEach((err, idx) => problems[idx] = exceptions_1.ValidationProblem.buildMsg(err));
        return problems;
    }
    /**
     * Validates if linked entities has valid references and if its linked property values match the referenced entity values.
     * @param entity The entity to be validated.
     * @param entityType The entity type of the to be validated.
     * @param repoFactory A repository factory
     */
    static validateLinkedEntities(entityType, entity, repoFactory) {
        return __awaiter(this, void 0, void 0, function* () {
            const problems = [];
            const propsLength = entityType.props.length;
            // Iterate entity properties.
            for (let idx = 0; idx < propsLength; idx++) {
                const prop = entityType.props[idx];
                const propValidation = prop.validation;
                // Validate only if the entity has a value for this property, the required constraint is validated by json schema.
                if (propValidation.type === core_models_1.PropertyTypes.linkedEntity && entity[prop.name] && entity[prop.name]._id) {
                    // Get the repository for the linked entity and try find it.
                    const lkdEntity = yield (yield repoFactory.createByName(propValidation.ref.name)).findById(entity[prop.name]._id);
                    // If we can't find an entity with the linked id, add a validation problem.
                    if (lkdEntity == null) {
                        problems.push(new exceptions_1.ValidationProblem(prop.name, "linkedEntity", exceptions_1.SysMsgs.validation.linkedEntityDoesNotExist, propValidation.ref.name, entity[prop.name]._id));
                    }
                    else {
                        // Iterate the linked properties and check if it equals the lineked entity values.
                        propValidation.linkedProperties.forEach(lkdProp => {
                            // Check if the value provided in linked properties equals linked entity values.
                            if (!_.isEqual(entity[prop.name][lkdProp.name], lkdEntity[lkdProp.name])) {
                                const p = prop.name + "." + lkdProp.name;
                                problems.push(new exceptions_1.ValidationProblem(p, "linkedValue", exceptions_1.SysMsgs.validation.divergentLinkedValue, p, lkdEntity[lkdProp.name]));
                            }
                        });
                    }
                }
            }
            return problems;
        });
    }
}
exports.EntityValidator = EntityValidator;
//# sourceMappingURL=entity-validator.js.map