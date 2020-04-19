import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { IEntityProperty } from "@poseidon/core-models";

/**
 * Build JSON schama validation for number properties.
 * @class
 */
export class NumberPropertySchemaBuilder implements ISchamaBuilderStrategy {
  async build(rootSchema: FluentSchemaBuilder, prop: IEntityProperty): Promise<FluentSchemaBuilder> {
    const propTypeName = prop.type.toLowerCase();

    const propSchema = new SchemaBuilder().type(<"integer" | "number">propTypeName);

    if (prop.min) propSchema.min(prop.min);

    if (prop.max) propSchema.max(prop.max);

    if (prop.multipleOf) propSchema.multipleOf(prop.multipleOf);

    return propSchema;
  }
}
