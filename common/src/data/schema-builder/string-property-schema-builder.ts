import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";

/**
 * Build JSON schama validation for string properties.
 * @class
 */
export class StringPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {
        let propSchema = new SchemaBuilder().type("string");

        if (validation.min)
            propSchema.minLength(validation.min);

        if (validation.max)
            propSchema.maxLength(validation.max);

        if (validation.pattern)
            propSchema.pattern(validation.pattern);

        return propSchema;
    }
}