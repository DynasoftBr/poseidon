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
/**
 * Build JSON schama validation for array properties.
 * @class
 */
class ArrayPropertySchemaBuilder {
    constructor(entitySchemaBuilder) {
        this.entitySchemaBuilder = entitySchemaBuilder;
    }
    build(rootSchema, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            const propSchema = new json_schema_fluent_builder_1.SchemaBuilder().array();
            // No additional items allowed.
            propSchema.additionalItems(false);
            if (validation.uniqueItems)
                propSchema.uniqueItems(true);
            if (validation.min)
                propSchema.minItems(validation.min);
            if (validation.max)
                propSchema.maxItems(validation.max);
            // Get the schema for items.
            const itemsSchema = yield this.entitySchemaBuilder.buildSchemaValidation(rootSchema, validation.items);
            propSchema.items(itemsSchema);
            return propSchema;
        });
    }
}
exports.ArrayPropertySchemaBuilder = ArrayPropertySchemaBuilder;
//# sourceMappingURL=array-property-schema-builder.js.map