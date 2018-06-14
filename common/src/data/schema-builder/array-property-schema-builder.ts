import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { FluentSchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";

/**
 * Build JSON schama validation for array properties.
 * @class
 */
export class ArrayPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {

    constructor(private readonly entitySchemaBuilder: EntitySchemaBuilder) {
        super();
    }

    async build(rootSchema: FluentSchemaBuilder, validation: Validation): Promise<FluentSchemaBuilder> {

        let propSchema = new SchemaBuilder().array();

        // No additional items allowed.
        propSchema.additionalItems(false);

        if (validation.uniqueItems)
            propSchema.uniqueItems(true);

        // Get the schema for items.
        let itemsSchema = await this.entitySchemaBuilder.buildSchemaValidation(rootSchema, validation.items);

        propSchema.items(itemsSchema);

        return propSchema;
    }
}