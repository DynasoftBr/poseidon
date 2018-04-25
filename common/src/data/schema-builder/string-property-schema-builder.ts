import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, EntityRepository, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";

/**
 * Build JSON schama validation for string properties.
 * @class
 */
export class StringPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: SchemaBuilderCore<any>, validation: Validation): Promise<SchemaBuilderGeneric> {
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