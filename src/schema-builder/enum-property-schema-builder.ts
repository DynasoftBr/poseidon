import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { SchemaBuilder, FluentSchemaBuilder } from "json-schema-fluent-builder";
import { IEntityProperty } from "@poseidon/core-models";

/**
 * Build JSON schama validation for enum properties.
 * @class
 */
export class EnumPropertySchemaBuilder implements ISchamaBuilderStrategy {
  async build(rootSchema: FluentSchemaBuilder, prop: IEntityProperty): Promise<FluentSchemaBuilder> {
    return new SchemaBuilder().string().enum(...prop.enum);
  }
}
