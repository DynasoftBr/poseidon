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
const entity_schema_builder_1 = require("../../../schema-builder/entity-schema-builder");
const build_validation_func_1 = require("../../../validation/build-validation-func");
const validate_entity_1 = require("../../../validation/validate-entity");
const validationFuncs = new Map();
/**
 * Validates an entity against it's schema.
 * @param entitytype The entity type of the entity to be validated.
 * @param entity The entity to be validated.
 */
function validateSchema(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { context, entityType, entity } = request;
        const entityTypeRepo = yield context.colection(core_models_1.SysEntities.entitySchema);
        const schemaColl = yield context.colection(core_models_1.SysEntities.entitySchema);
        // Instantiates ajv library, compiles the schema, them validates the entity.
        let valFunc = validationFuncs.get(entityType._id);
        if (!valFunc) {
            // find entity schema or build it.
            const schema = (yield schemaColl.findOne({})) || (yield new entity_schema_builder_1.EntitySchemaBuilder(entityTypeRepo)
                .buildSchema(entityType)).getSchema();
            valFunc = build_validation_func_1.buildValidationFunc(schema);
            validationFuncs.set(entityType._id, valFunc);
        }
        // Get schema problems and return it.
        request.problems = [...request.problems, ...validate_entity_1.validateEntity(valFunc, entity)];
    });
}
exports.validateSchema = validateSchema;
//# sourceMappingURL=validate-schema.js.map