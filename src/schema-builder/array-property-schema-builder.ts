import { ISchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntitySchemaBuilder } from "./entity-schema-builder";
import { IValidation } from "@poseidon/core-models";

/**
 * Build JSON schama validation for array properties.
 * @class
 */
export class ArrayPropertySchemaBuilder implements ISchamaBuilderStrategy {

    constructor(private readonly entitySchemaBuilder: EntitySchemaBuilder) { }

    async build(rootSchema: FluentSchemaBuilder, validation: IValidation): Promise<FluentSchemaBuilder> {

        const propSchema = new SchemaBuilder().array();

        // No additional items allowed.
        propSchema.additionalItems(false);

        if (validation.uniqueItems)
            propSchema.uniqueItems(true);

        if (validation.min)
            propSchema.minItems(validation.min);

        if (validation.max)
            propSchema.maxItems(validation.max);

        // Get the schema for items.
        const itemsSchema = await this.entitySchemaBuilder.buildSchemaValidation(rootSchema, validation.items);

        propSchema.items(itemsSchema);

        return propSchema;
    }
}