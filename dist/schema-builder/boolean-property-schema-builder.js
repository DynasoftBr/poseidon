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
 * Build JSON schama validation for boolean properties.
 * @class
 */
class BooleanPropertySchemaBuilder {
    build(rootSchema, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            return new json_schema_fluent_builder_1.SchemaBuilder().bool();
        });
    }
}
exports.BooleanPropertySchemaBuilder = BooleanPropertySchemaBuilder;
//# sourceMappingURL=boolean-property-schema-builder.js.map