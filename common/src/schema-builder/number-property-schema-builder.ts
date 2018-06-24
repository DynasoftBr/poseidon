import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { Validation } from "../..";

/**
 * Build JSON schama validation for number properties.
 * @class
 */
export class NumberPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {
        const propTypeName = validation.type.toLowerCase();

        const propSchema = new SchemaBuilder().type(<"integer" | "number">propTypeName);

        if (validation.min)
            propSchema.min(validation.min);

        if (validation.max)
            propSchema.max(validation.max);

        if (validation.multipleOf)
            propSchema.multipleOf(validation.multipleOf);

        return propSchema;
    }
}