import { SchemaBuilderObject, SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { Entity, EntityType, Validation, EntityProperty } from "../../models";
import { PropertyType, SysEntities } from "../../constants";
import { EntityRepository } from "../";
import { LinkedEntitySchemaBuilder } from "./linked-entity-schema-builder";
import { AbstractEntitySchamBuilder } from "./abstract-entity-schema-builder";
import { REFUSED } from "dns";
import { StringPropertySchemaBuilder } from "./string-property-schema-builder";
import { DateTimePropertySchemaBuilder } from "./date-time-property-schema-builder";
import { BooleanPropertySchemaBuilder } from "./boolean-property-schema-builder";
import { NumberPropertySchemaBuilder } from "./number-property-schema-builder";
import { EnumPropertySchemaBuilder } from "./enum-property-schema-builder";
import { SysError, SysMsgs } from "../..";

export class EntitySchemaBuilder {
    /**
     * Builds the schema for the specified entity type.
     */
    public static async buildSchema(entityType: EntityType): Promise<SchemaBuilderObject> {
        // The root schema.
        let schema = new SchemaBuilder().object();

        // No additional properties allowed.
        schema.additionalProperties(false);

        // Iterate entity type properties to build each ones schema.
        entityType.props.forEach(async (prop) => {
            let bs = await this.buildSchemaValidation(schema, prop.validation);
            schema.prop(prop.name, bs, prop.validation.required)
        });

        return schema;
    }

    /**
     * Builds a sub schema for an property using its validation specification.
     * @param rootSchema The root schema.
     * @param validation A validation object that is used to build the schema.
     */
    public static async buildSchemaValidation(rootSchema: SchemaBuilderCore<any>,
        validation: Validation): Promise<SchemaBuilderGeneric> {

        let propSchema: SchemaBuilderGeneric;

        switch (validation.type) {
            case PropertyType.linkedEntity:
                return new LinkedEntitySchemaBuilder().build(rootSchema, validation);

            case PropertyType.abstractEntity:
                return new AbstractEntitySchamBuilder().build(rootSchema, validation);

            case PropertyType.array:
                return new AbstractEntitySchamBuilder().build(rootSchema, validation);

            case PropertyType.string:
                return new StringPropertySchemaBuilder().build(rootSchema, validation);

            // Handle date.
            case PropertyType.dateTime:
                return new DateTimePropertySchemaBuilder().build(rootSchema, validation);

            // handle boolean.
            case PropertyType.boolean:
                return new BooleanPropertySchemaBuilder().build(rootSchema, validation);

            // Handle number and int.
            case PropertyType.number || PropertyType.int:
                return new NumberPropertySchemaBuilder().build(rootSchema, validation);

            // Handle enum.
            case PropertyType.enum:
                return new EnumPropertySchemaBuilder().build(rootSchema, validation);

            default:
                throw new Error(SysMsgs.crash.unexpectedError.message);
        }

    }
}