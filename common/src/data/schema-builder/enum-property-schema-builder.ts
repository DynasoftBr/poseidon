import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";

/**
 * Build JSON schama validation for enum properties.
 * @class
 */
export class EnumPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: SchemaBuilderCore<any>, validation: Validation): Promise<SchemaBuilderGeneric> {
        return new SchemaBuilder().type("string").enum(...validation.enum);
    }
}