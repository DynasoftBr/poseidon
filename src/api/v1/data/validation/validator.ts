import * as _ from "lodash";
import * as loki from "lokijs";
import { EntityType, EntityProperty, Entity, PropertyConvention, PropertyType, LinkedEntity, Validation } from "../../models";
import { ValidateMsg } from "./validate-msg";
import { EntityRepository } from "../entity-repository";
import { ValidationError } from "../../exceptions";
import { ValidationResult } from "./validation-result";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilderGeneric, SchemaBuilderCore, SchemaBuilderObject } from "json-schema-fluent-builder/lib/builders";
import { InMemoryDb } from "../in-memory";

/**
 * Class responsible for validating the object.
 * @class
 */
export class Validator {
    private validateMsgs: ValidateMsg[];
    private validationErrors: ValidationError[];

    private constructor(private entityType: EntityType, private entity: Entity) {
    }

    private buildSchema(entity: EntityType): Promise<SchemaBuilderObject> {
        return new Promise((resolve, reject) => {
            let schema = new SchemaBuilder().object();

            entity.props.forEach(prop => {
                schema.prop(prop.name,
                    this.buildSchemaValidation(prop.validation),
                    prop.validation.required);
            });

            resolve(schema)
        });
    }

    private buildSchemaValidation(validation: Validation): Promise<SchemaBuilderGeneric> {
        let propSchema: SchemaBuilderGeneric;

        // Handle string.
        if (validation.type === PropertyType.String) {
            propSchema = new SchemaBuilder().type("string");

            if (validation.min)
                propSchema.minLength(validation.min);

            if (validation.max)
                propSchema.maxLength(validation.max);

            if (validation.pattern)
                propSchema.pattern(validation.pattern);

            // Handle date.
        } else if (validation.type === PropertyType.Date) {

            propSchema = new SchemaBuilder().type("string").format("date-time");

            // handle boolean.       
        } else if (validation.type === PropertyType.Boolean) {

            propSchema = new SchemaBuilder().type("boolean");

            // Handle number and int.
        } else if (validation.type === PropertyType.Number ||
            validation.type === PropertyType.Int) {

            propSchema = new SchemaBuilder()
                .type(<"integer" | "number">validation.type.toLowerCase());
            if (validation.min)
                propSchema.min(validation.min);

            if (validation.max)
                propSchema.min(validation.min);

            if (validation.multipleOf)
                propSchema.multipleOf(validation.multipleOf);

            // Handle enum.
        } else if (validation.type === PropertyType.Enum) {

            propSchema = new SchemaBuilder().type("string").enum(...validation.enum);

            // Handle array.
        } else if (validation.type === PropertyType.Array) {
            propSchema = new SchemaBuilder().type("array");

            propSchema.items(this.buildSchemaValidation(validation.items));
            if (validation.uniqueItems)
                propSchema.uniqueItems(true);

            // Handle linkedEntity
        } else if (validation.type === PropertyType.LinkedEntity) {
            return new Promise((resolve, reject) => {

                InMemoryDb.schemas
                EntityRepository.getRepositoty("entityType").then(repo => {

                    repo.findOne(validation.ref.id).then(et => {

                    });

                });

            })
        }

        return Promise.resolve(propSchema);
    }

    private parseDefaultValue(text: string, propType: string): any {
        let defVal = this.parseConstants(text);

        if (propType === PropertyType.String)
            return defVal;
        else if (propType === PropertyType.Date)
            return new Date(defVal);
        else
            return defVal;
    }

    /**
     * This method look for constants in the text and replaces it with the respective value.
     * For now, only [[NOW]] is accepted.
     * @func
     * @param text Text to be parsed.
     */
    private parseConstants(text: string): string {
        let matches = text.match(/\[\[(\w*)\]\]/);

        matches.forEach((key, idx) => {
            if (key === "[[NOW]]")
                text = text.replace(key, new Date().toISOString());
        });

        return text;
    }
}