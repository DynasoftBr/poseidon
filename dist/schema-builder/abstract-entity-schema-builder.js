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
const json_schema_fluent_builder_2 = require("json-schema-fluent-builder");
/**
 * Build JSON schama validation for Abstract Entities.
 * @class
 */
class AbstractEntitySchamBuilder {
    constructor(entityTypeRepository, entitySchemaBuilder) {
        this.entityTypeRepository = entityTypeRepository;
        this.entitySchemaBuilder = entitySchemaBuilder;
    }
    build(rootSchema, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            const ref = validation.ref;
            const definitions = (rootSchema.getSchema().definitions);
            // If the root schema has a definition for this entity type, just return a refernce to that definition.
            if (definitions && definitions[ref.name])
                return new json_schema_fluent_builder_1.FluentSchemaBuilder({}).$ref("#/definitions/" + ref.name);
            // If the root schema doesn't have a definition for this entity type, we build one.
            else {
                const definition = new json_schema_fluent_builder_2.SchemaBuilder().object();
                // First of all we add the new definition to the root schema to allow recursive calls know that it already exist
                rootSchema.definitions(ref.name, definition);
                const abstractEtType = yield this.entityTypeRepository.findById(ref._id);
                // The abstract also can not have additional properties.
                definition.additionalProperties(false);
                const propsLength = abstractEtType.props.length;
                // Iterate abstract entity's properties and build the schema for each one.
                for (let idx = 0; idx < propsLength; idx++) {
                    const absProp = abstractEtType.props[idx];
                    const schema = yield this.entitySchemaBuilder.buildSchemaValidation(rootSchema, absProp.validation);
                    definition.prop(absProp.name, schema, absProp.validation.required);
                }
                return new json_schema_fluent_builder_1.FluentSchemaBuilder({}).$ref("#/definitions/" + ref.name);
            }
        });
    }
}
exports.AbstractEntitySchamBuilder = AbstractEntitySchamBuilder;
//# sourceMappingURL=abstract-entity-schema-builder.js.map