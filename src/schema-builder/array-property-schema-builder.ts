import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import { EntityProperty } from "@poseidon/core-models";

/**
 * Build JSON schama validation for array properties.
 * @class
 */
export class ArrayPropertySchemaBuilder implements ISchamaBuilderStrategy {
  constructor(private readonly entitySchemaBuilder: EntitySchemaBuilder) {}

  async build(rootSchema: FluentSchemaBuilder, prop: EntityProperty): Promise<FluentSchemaBuilder> {
    const propSchema = new SchemaBuilder().array();

    // No additional items allowed.
    propSchema.additionalItems(false);

    if (prop.uniqueItems) propSchema.uniqueItems(true);

    if (prop.min) propSchema.minItems(prop.min);

    if (prop.max) propSchema.maxItems(prop.max);

    propSchema.items({ type: prop.items as any });

    return propSchema;
  }
}
