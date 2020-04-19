import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { IEntityProperty } from "@poseidon/core-models";

/**
 * Build JSON schama validation for string properties.
 * @class
 */
export class StringPropertySchemaBuilder implements ISchamaBuilderStrategy {
  async build(rootSchema: FluentSchemaBuilder, prop: IEntityProperty): Promise<FluentSchemaBuilder> {
    const propSchema = new SchemaBuilder().string();

    if (prop.min) propSchema.minLength(prop.min);

    if (prop.max) propSchema.maxLength(prop.max);

    if (prop.pattern) propSchema.pattern(prop.pattern);

    return propSchema;
  }
}
