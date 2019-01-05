import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { Validation } from "..";

/**
 * Build JSON schama validation for date-time properties.
 * @class
 */
export class DateTimePropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {
        return new FluentSchemaBuilder({}).format("date-time");
    }
}