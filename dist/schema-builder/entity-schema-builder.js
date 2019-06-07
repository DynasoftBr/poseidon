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
const linked_entity_schema_builder_1 = require("./linked-entity-schema-builder");
const abstract_entity_schema_builder_1 = require("./abstract-entity-schema-builder");
const string_property_schema_builder_1 = require("./string-property-schema-builder");
const date_time_property_schema_builder_1 = require("./date-time-property-schema-builder");
const boolean_property_schema_builder_1 = require("./boolean-property-schema-builder");
const number_property_schema_builder_1 = require("./number-property-schema-builder");
const enum_property_schema_builder_1 = require("./enum-property-schema-builder");
const array_property_schema_builder_1 = require("./array-property-schema-builder");
const core_models_1 = require("@poseidon/core-models");
class EntitySchemaBuilder {
    constructor(entityTypeRepository) {
        this.entityTypeRepository = entityTypeRepository;
    }
    /**
     * Builds the schema for the specified entity type.
     */
    buildSchema(entityType) {
        return __awaiter(this, void 0, void 0, function* () {
            // The root schema.
            const schema = new json_schema_fluent_builder_1.SchemaBuilder().object();
            // No additional properties allowed.
            schema.additionalProperties(false);
            // Iterate entity type properties to build each ones schema.
            const propsLength = entityType.props.length;
            for (let idx = 0; idx < propsLength; idx++) {
                const prop = entityType.props[idx];
                const bs = yield this.buildSchemaValidation(schema, prop.validation);
                schema.prop(prop.name, bs, prop.validation.required);
            }
            return schema;
        });
    }
    /**
     * Builds a sub schema for an property using its validation specification.
     * @param rootSchema The root schema.
     * @param validation A validation object that is used to build the schema.
     */
    buildSchemaValidation(rootSchema, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            let propSchema;
            switch (validation.type) {
                case core_models_1.PropertyTypes.linkedEntity:
                    return new linked_entity_schema_builder_1.LinkedEntitySchemaBuilder(this.entityTypeRepository, this)
                        .build(rootSchema, validation);
                case core_models_1.PropertyTypes.abstractEntity:
                    return new abstract_entity_schema_builder_1.AbstractEntitySchamBuilder(this.entityTypeRepository, this)
                        .build(rootSchema, validation);
                case core_models_1.PropertyTypes.array:
                    return new array_property_schema_builder_1.ArrayPropertySchemaBuilder(this)
                        .build(rootSchema, validation);
                case core_models_1.PropertyTypes.string:
                    return new string_property_schema_builder_1.StringPropertySchemaBuilder()
                        .build(rootSchema, validation);
                // Handle date.
                case core_models_1.PropertyTypes.dateTime:
                    return new date_time_property_schema_builder_1.DateTimePropertySchemaBuilder()
                        .build(rootSchema, validation);
                // handle boolean.
                case core_models_1.PropertyTypes.boolean:
                    return new boolean_property_schema_builder_1.BooleanPropertySchemaBuilder()
                        .build(rootSchema, validation);
                // Handle number and int.
                case core_models_1.PropertyTypes.number:
                case core_models_1.PropertyTypes.int:
                    return new number_property_schema_builder_1.NumberPropertySchemaBuilder()
                        .build(rootSchema, validation);
                // Handle enum.
                case core_models_1.PropertyTypes.enum:
                    return new enum_property_schema_builder_1.EnumPropertySchemaBuilder()
                        .build(rootSchema, validation);
                default:
                    throw new Error(validation.type);
            }
        });
    }
}
exports.EntitySchemaBuilder = EntitySchemaBuilder;
//# sourceMappingURL=entity-schema-builder.js.map