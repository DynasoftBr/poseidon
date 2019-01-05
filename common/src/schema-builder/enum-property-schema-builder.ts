import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { SchemaBuilder, FluentSchemaBuilder } from "json-schema-fluent-builder";
import { Validation } from "..";

/**
 * Build JSON schama validation for enum properties.
 * @class
 */
export class EnumPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {
        return new SchemaBuilder().string().enum(...validation.enum);
    }
}