import * as _ from "lodash";
import * as loki from "lokijs";
import * as Ajv from 'ajv';

import { EntityType, EntityProperty, Entity, PropertyConvention, PropertyType, LinkedEntity, Validation } from "../../models";
import { ValidationProblem } from "./validation-problem";
import { EntityRepository } from "../entity-repository";
import { ValidationError, SysError } from "../../exceptions";
import { SchemaBuilder } from "json-schema-fluent-builder";
import { SchemaBuilderGeneric, SchemaBuilderCore, SchemaBuilderObject } from "json-schema-fluent-builder/lib/builders";
import { SchemaModel } from "json-schema-fluent-builder/lib/models";

/**
 * Class responsible for validating the object.
 * @class
 */
export class Validator {

    private constructor(private entityType: EntityType, private entity: Entity) {
    }

    /**
     * Validates an entity against an entity type specification.
     * @param entitytype Entity type to validate against.
     * @param entity Object to be validated
     * @static
     * @func
     */
    static validate(entitytype: EntityType, entity: Entity): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            // instatiates a new validator.
            let validator = new Validator(entitytype, entity);

            // builds the schema for the specified entity type.
            validator.buildSchema().then(schema => {

                // validates the object.
                let problems = validator.validateJsonSchema(schema.getSchema());

                if (problems && problems.length > 0)
                    reject(new ValidationError(problems));
                else
                    resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * Builds the schema for the specified entity type.
     */
    private buildSchema(): Promise<SchemaBuilderObject> {
        return new Promise((resolve, reject) => {
            let schema = new SchemaBuilder().object();
            let promises: Promise<SchemaBuilderGeneric>[] = [];
            this.entityType.props.forEach(prop => {

                let bs = this.buildSchemaValidation(schema, prop.validation, this.entityType.name);
                promises.push(bs);
                bs.then(res => {
                    schema.prop(prop.name,
                        res,
                        prop.validation.required);
                });
            });

            Promise.all(promises).then(res => {
                resolve(schema);
            }).catch(err => {
                reject(err);
            });

        });
    }

    private buildSchemaValidation(rootSchema: SchemaBuilderCore<any>, validation: Validation, etTypeName: string): Promise<SchemaBuilderGeneric> {
        let propSchema: SchemaBuilderGeneric;
        return new Promise<SchemaBuilderGeneric>((resolve, reject) => {

            // Handle Linked Entity
            if (validation.type === PropertyType.linkedEntity) {
                propSchema = new SchemaBuilder().type("object");
                propSchema.additionalProperties(false);

                if (validation.default)
                    propSchema.default(this.parseDefaultValue("", validation.type));

                let lkdEtType: EntityType;
                EntityRepository.getRepositoty("entity_type").then(etRepo => {
                    return etRepo.findOne(validation.ref.id);

                }).then((lkdEntityType: EntityType) => {
                    let promises: Promise<SchemaBuilderGeneric>[] = [];

                    validation.linkedProperties.forEach((lkdProp) => {
                        var foundProp: EntityProperty = lkdEntityType.props.find(o => {
                            if (o.name === "_id")
                                return o.name === "_" + lkdProp.name
                            else
                                return o.name === lkdProp.name
                        });

                        if (foundProp) {
                            let bsPromise = this.buildSchemaValidation(rootSchema, foundProp.validation,
                                lkdEntityType.name);
                            promises.push(bsPromise);

                            bsPromise.then(schema => {
                                propSchema.prop(lkdProp.name, schema, foundProp.validation.required);
                            });
                        }
                    });

                    Promise.all(promises).then(res => {
                        resolve(propSchema);
                    }).catch(err => {
                        reject(err);
                    });
                });

            } else if (validation.type === PropertyType.abstractEntity) {

                propSchema = new SchemaBuilderGeneric({}).$ref("#/definitions/" + validation.ref.name);
                let definitions = (<any>rootSchema.getSchema().definitions);
                
                if (definitions && definitions[validation.ref.name])
                    resolve(propSchema);

                else {
                    let definition = new SchemaBuilder().object();
                    rootSchema.definitions(validation.ref.name, definition);

                    EntityRepository.getRepositoty("entity_type").then(etRepo => {
                        return etRepo.findOne(validation.ref.id);

                    }).then((abstractEtType: EntityType) => {
                        let promises: Promise<SchemaBuilderGeneric>[] = [];

                        abstractEtType.props.forEach(absProp => {
                            let bsPromise = this.buildSchemaValidation(rootSchema, absProp.validation,
                                abstractEtType.name);

                            promises.push(bsPromise);

                            bsPromise.then(schema => {
                                definition.prop(absProp.name, schema, absProp.validation.required);
                            });
                        });

                        Promise.all(promises).then(res => {
                            resolve(propSchema);
                        }).catch(err => {
                            reject(err);
                        });
                    });
                }

            } else if (validation.type === PropertyType.array) {
                propSchema = new SchemaBuilder().type("array");
                propSchema.additionalItems(false);
                if (validation.uniqueItems)
                    propSchema.uniqueItems(true);

                this.buildSchemaValidation(rootSchema, validation.items, etTypeName)
                    .then(res => {
                        propSchema.items(res);
                        resolve(propSchema);
                    }).catch(err => {
                        reject(err);
                    });
            }
            else {
                // Handle string.
                if (validation.type === PropertyType.string) {
                    propSchema = new SchemaBuilder().type("string");

                    if (validation.min)
                        propSchema.minLength(validation.min);

                    if (validation.max)
                        propSchema.maxLength(validation.max);

                    if (validation.pattern)
                        propSchema.pattern(validation.pattern);

                    // Handle date.
                } else if (validation.type === PropertyType.dateTime) {

                    propSchema = new SchemaBuilder().type("string").format("date-time");

                    // handle boolean.
                } else if (validation.type === PropertyType.boolean) {

                    propSchema = new SchemaBuilder().type("boolean");

                    // Handle number and int.
                } else if (validation.type === PropertyType.number ||
                    validation.type === PropertyType.int) {

                    propSchema = new SchemaBuilder()
                        .type(<"integer" | "number">validation.type.toLowerCase());
                    if (validation.min)
                        propSchema.min(validation.min);

                    if (validation.max)
                        propSchema.min(validation.min);

                    if (validation.multipleOf)
                        propSchema.multipleOf(validation.multipleOf);

                    // Handle enum.
                } else if (validation.type === PropertyType.enum) {
                    propSchema = new SchemaBuilder().type("string").enum(...validation.enum);

                }

                if (validation.default)
                    propSchema.default(this.parseDefaultValue("", validation.type));

                resolve(propSchema);
            }
        });
    }

    private validateJsonSchema(schema: SchemaModel): ValidationProblem[] {
        let jsonVal = new Ajv({ allErrors: true, verbose: true });
        let validate = jsonVal.compile(schema);

        let valid = validate(this.entity);
        if (!valid) {
            let msgs: ValidationProblem[] = [];
            validate.errors.forEach(err => {
                msgs.push(ValidationProblem.buildMsg(err));
            });

            return msgs;
        }

        return null;
    }

    private parseDefaultValue(text: string, propType: string): any {
        let defVal = this.parseConstants(text);

        if (propType === PropertyType.string)
            return defVal;
        else if (propType === PropertyType.dateTime)
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

        if (!matches)
            return text;

        matches.forEach((key, idx) => {
            if (key === "[[NOW]]")
                text = text.replace(key, new Date().toISOString());
        });

        return text;
    }
}