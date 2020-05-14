import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { EntityProperty } from "@poseidon/core-models";

/**
 * Build JSON schama validation for date-time properties.
 * @class
 */
export class DateTimePropertySchemaBuilder implements ISchamaBuilderStrategy {
  async build(rootSchema: FluentSchemaBuilder): Promise<FluentSchemaBuilder> {
    return new FluentSchemaBuilder({}).format("date-time");
  }
}
