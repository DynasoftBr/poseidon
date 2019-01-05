import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { Validation } from "..";

/**
 * Build JSON schama validation for string properties.
 * @class
 */
export class StringPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {
        const propSchema = new SchemaBuilder().string();

        if (validation.min)
            propSchema.minLength(validation.min);

        if (validation.max)
            propSchema.maxLength(validation.max);

        if (validation.pattern)
            propSchema.pattern(validation.pattern);

        return propSchema;
    }
}