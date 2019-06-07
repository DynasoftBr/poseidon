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
const json_schema_fluent_builder_1 = require("json-schema-fluent-builder");
const _ = require("lodash");
/**
 * Build JSON schama validation for linked entities.
 * @class
 */
class LinkedEntitySchemaBuilder {
    constructor(entityTypeRepository, entitySchemaBuilder) {
        this.entityTypeRepository = entityTypeRepository;
        this.entitySchemaBuilder = entitySchemaBuilder;
    }
    build(rootSchema, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            const propSchema = new json_schema_fluent_builder_1.SchemaBuilder().object();
            propSchema.additionalProperties(false);
            // Try find the linked entity type.
            const lkdEntityType = yield this.entityTypeRepository.findById(validation.ref._id);
            // Iterate only the LINKED PROPERTIES and build it's schema.
            const propsLength = validation.linkedProperties.length;
            for (let idx = 0; idx < propsLength; idx++) {
                const lkdProp = validation.linkedProperties[idx];
                // Find's the linked property in the linked entity type.
                const foundProp = _.find(lkdEntityType.props, { name: lkdProp.name });
                // Call buildSchemaValidation recursively to build schema.
                const schema = yield this.entitySchemaBuilder.buildSchemaValidation(rootSchema, foundProp.validation);
                propSchema.prop(foundProp.name, schema, foundProp.validation.required);
            }
            return propSchema;
        });
    }
}
exports.LinkedEntitySchemaBuilder = LinkedEntitySchemaBuilder;
//# sourceMappingURL=linked-entity-schema-builder.js.map