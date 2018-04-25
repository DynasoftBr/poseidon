import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, EntityRepository, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";

/**
 * Build JSON schama validation for array properties.
 * @class
 */
export class ArrayPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: SchemaBuilderCore<any>, validation: Validation): Promise<SchemaBuilderGeneric> {

        let propSchema = new SchemaBuilder().type("array");

        // No additional items allowed.
        propSchema.additionalItems(false);

        if (validation.uniqueItems)
            propSchema.uniqueItems(true);

        // Get the schema for items.
        let itemsSchema = await EntitySchemaBuilder.buildSchemaValidation(rootSchema, validation.items);

        propSchema.items(itemsSchema);

        return propSchema;
    }
}