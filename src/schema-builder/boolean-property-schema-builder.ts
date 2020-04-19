import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";

/**
 * Build JSON schama validation for boolean properties.
 * @class
 */
export class BooleanPropertySchemaBuilder implements ISchamaBuilderStrategy {
  async build(rootSchema: FluentSchemaBuilder): Promise<FluentSchemaBuilder> {
    return new SchemaBuilder().bool();
  }
}
