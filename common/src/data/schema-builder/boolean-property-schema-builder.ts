import { AbstractSchamaBuilderStrategy } from "./abstract-schema-builder-strategy";
import { SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { EntityType, EntityRepository, Validation, EntityProperty } from "../..";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "./entity-schema-builder";

/**
 * Build JSON schama validation for boolean properties.
 * @class
 */
export class BooleanPropertySchemaBuilder extends AbstractSchamaBuilderStrategy {
    async build(rootSchema: SchemaBuilderCore<any>, validation: Validation): Promise<SchemaBuilderGeneric> {
        return new SchemaBuilder().type("boolean");
    }
}