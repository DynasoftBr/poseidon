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
 * Build JSON schama validation for number properties.
 * @class
 */
class NumberPropertySchemaBuilder {
    build(rootSchema, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            const propTypeName = validation.type.toLowerCase();
            const propSchema = new json_schema_fluent_builder_1.SchemaBuilder().type(propTypeName);
            if (validation.min)
                propSchema.min(validation.min);
            if (validation.max)
                propSchema.max(validation.max);
            if (validation.multipleOf)
                propSchema.multipleOf(validation.multipleOf);
            return propSchema;
        });
    }
}
exports.NumberPropertySchemaBuilder = NumberPropertySchemaBuilder;
//# sourceMappingURL=number-property-schema-builder.js.map