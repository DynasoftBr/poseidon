import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { StringPropertySchemaBuilder } from "./string-property-schema-builder";
import { DateTimePropertySchemaBuilder } from "./date-time-property-schema-builder";
import { BooleanPropertySchemaBuilder } from "./boolean-property-schema-builder";
import { NumberPropertySchemaBuilder } from "./number-property-schema-builder";
import { EnumPropertySchemaBuilder } from "./enum-property-schema-builder";
import { ArrayPropertySchemaBuilder } from "./array-property-schema-builder";
import { IRepository } from "../data";
import { IEntityType, PropertyTypes, IEntityProperty } from "@poseidon/core-models";
import { Context } from "../context";

export class EntitySchemaBuilder {
  constructor(private readonly context: Context) {}

  /**
   * Builds the schema for the specified entity type.
   */
  public async buildSchema(entityType: IEntityType): Promise<FluentSchemaBuilder> {
    // The root schema.
    const schema = new SchemaBuilder().object();

    // No additional properties allowed.
    schema.additionalProperties(false);

    // Iterate entity type properties to build each ones schema.
    const propsLength = entityType.props.length;
    for (let idx = 0; idx < propsLength; idx++) {
      const prop = entityType.props[idx];

      const bs = await this.buildSchemaValidation(schema, prop);
      schema.prop(prop.name, bs, prop.required);
    }

    return schema;
  }

  /**
   * Builds a sub schema for an property using its validation specification.
   * @param rootSchema The root schema.
   * @param prop A property object that is used to build the schema.
   */
  public async buildSchemaValidation(rootSchema: FluentSchemaBuilder, prop: IEntityProperty): Promise<FluentSchemaBuilder> {
    let propSchema: FluentSchemaBuilder;

    switch (prop.type) {
      case PropertyTypes.array:
        return new ArrayPropertySchemaBuilder(this).build(rootSchema, prop);

      case PropertyTypes.string:
        return new StringPropertySchemaBuilder().build(rootSchema, prop);

      // Handle date.
      case PropertyTypes.dateTime:
        return new DateTimePropertySchemaBuilder().build(rootSchema);

      // handle boolean.
      case PropertyTypes.boolean:
        return new BooleanPropertySchemaBuilder().build(rootSchema);

      // Handle number and int.
      case PropertyTypes.number:
      case PropertyTypes.int:
        return new NumberPropertySchemaBuilder().build(rootSchema, prop);

      // Handle enum.
      case PropertyTypes.enum:
        return new EnumPropertySchemaBuilder().build(rootSchema, prop);

      default:
        throw new Error(prop.type);
    }
  }
}
