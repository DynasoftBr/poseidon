import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { IValidation } from "@poseidon/core-models";

/**
 * Build JSON schama validation for string properties.
 * @class
 */
export class StringPropertySchemaBuilder implements ISchamaBuilderStrategy {
    async build(rootSchema: FluentSchemaBuilder, validation: IValidation): Promise<FluentSchemaBuilder> {
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