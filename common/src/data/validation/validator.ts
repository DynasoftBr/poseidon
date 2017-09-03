import * as _ from "lodash";
import * as Ajv from "ajv";

import {
    EntityType, EntityProperty, Entity, PropertyConvention,
    PropertyType, Validation, SysEntities, SysProperties
} from "../../models";
import { ValidationError, ValidationProblem } from "./";
import { EntityRepository } from "../entity-repository";
import { SchemaBuilder } from "json-schema-fluent-builder";
import {
    SchemaBuilderGeneric, SchemaBuilderCore,
    SchemaBuilderObject
} from "json-schema-fluent-builder/lib/builders";
import { SchemaModel } from "json-schema-fluent-builder/lib/models";
import { SysError, SysMsgs } from "../../";

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
    static validate(entitytype: EntityType, entity: Entity, isNew: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            let problems: ValidationProblem[] = [];

            // instatiates a new validator.
            let validator = new Validator(entitytype, entity);

            // builds the schema for the specified entity type.
            validator.buildSchema().then(schema => {
                // validates the object.
                problems.push(...validator.validateJsonSchema(schema.getSchema()));

                // Starts linked entity validation.
                return validator.validateLinkedEntities();

            }).then((messages) => {

                problems.push(...messages);

                // If it's an entity_type, validate required entity properties.
                if (validator.entityType.name == SysEntities.entityType)
                    problems.push(...validator.requireReservedProperties());

                if (problems.length > 0)
                    reject(new ValidationError(problems)); // Rejects with an validation error.
                else
                    resolve();
            }).catch(err => {
                reject(err); // This is not expected. Probably and database connection error.
            });
        });
    }

    /**
     * Builds the schema for the specified entity type.
     */
    private buildSchema(): Promise<SchemaBuilderObject> {
        return new Promise((resolve, reject) => {
            // The root schema.
            let schema = new SchemaBuilder().object();
            schema.additionalProperties(false);

            let promises: Promise<SchemaBuilderGeneric>[] = [];
            this.entityType.props.forEach(prop => {

                // Builds the validation for current property.
                let bs = this.buildSchemaValidation(schema, prop.validation);
                promises.push(bs);

                // On promise resolve set the property in the root schema
                bs.then(res => schema.prop(prop.name, res, prop.validation.required));
            });

            // Wait for all promises return and resolve or reject if any error occur.
            Promise.all(promises).then(res => {
                resolve(schema);
            }).catch(err => {
                reject(err); // This is not expected. Probably and database connection error.
            });

        });
    }

    /**
     * Builds a sub schema for an property using its validation specification.
     * @param rootSchema The root schema.
     * @param validation A validation object that is used to build the schema.
     */
    private buildSchemaValidation(rootSchema: SchemaBuilderCore<any>, validation: Validation)
        : Promise<SchemaBuilderGeneric> {

        let propSchema: SchemaBuilderGeneric;
        return new Promise<SchemaBuilderGeneric>((resolve, reject) => {

            // Handle Linked Entity
            if (validation.type === PropertyType.linkedEntity) {
                propSchema = new SchemaBuilder().type("object");
                propSchema.additionalProperties(false);

                let lkdEtType: EntityType;

                // Get's an entity type repository then finds the linked entity type.
                EntityRepository.getRepositoty(SysEntities.entityType).then(etRepo => {
                    return etRepo.findOne(validation.ref._id);

                }).then((lkdEntityType: EntityType) => {
                    let promises: Promise<SchemaBuilderGeneric>[] = [];

                    // Iterate linked properties to build each schema validation
                    validation.linkedProperties.forEach((lkdProp) => {

                        // Find's the linked property in the linked entity type.
                        let foundProp: EntityProperty = _.find(lkdEntityType.props, { name: lkdProp.name });

                        // Call buildSchemaValidation recursively to build schema.
                        // and add the returned promise to the array to wait for it.
                        let bsPromise = this.buildSchemaValidation(rootSchema, foundProp.validation);
                        promises.push(bsPromise);

                        // When promises resolve add the property to the schema.
                        bsPromise.then(schema => {
                            propSchema.prop(foundProp.name, schema, foundProp.validation.required);
                        });
                    });

                    // Wait all promises to resolve and resolve this func or reject if any error occur.
                    Promise.all(promises).then(res => {
                        resolve(propSchema);
                    }).catch(err => {
                        reject(err); // This is not expected. Probably and database connection error.
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

                    definition.additionalProperties(false);

                    EntityRepository.getRepositoty(SysEntities.entityType).then(etRepo => {
                        return etRepo.findOne(validation.ref._id);

                    }).then((abstractEtType: EntityType) => {
                        let promises: Promise<SchemaBuilderGeneric>[] = [];

                        abstractEtType.props.forEach(absProp => {
                            let bsPromise = this.buildSchemaValidation(rootSchema, absProp.validation);

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

                this.buildSchemaValidation(rootSchema, validation.items)
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

                    propSchema = new SchemaBuilderGeneric({}).format("date-time");

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

                resolve(propSchema);
            }
        });
    }

    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private validateJsonSchema(schema: SchemaModel): ValidationProblem[] {
        // Instantiates ajv library, compiles the schema, them validates the entity.
        let jsonVal = new Ajv({ allErrors: true, verbose: true });
        let validate = jsonVal.compile(schema);
        let valid = validate(this.entity);

        // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
        if (!valid) {
            let problems: ValidationProblem[] = [];
            validate.errors.forEach(err => {
                problems.push(ValidationProblem.buildMsg(err));
            });

            return problems;
        }

        return [];
    }

    private validateLinkedEntities(): Promise<ValidationProblem[]> {
        return new Promise<ValidationProblem[]>((resolve, reject) => {

            let problems: ValidationProblem[] = [];

            let promises: Promise<Entity>[] = [];

            this.entityType.props.forEach((prop) => {
                if (prop.validation.type === PropertyType.linkedEntity
                    && this.entity[prop.name] && this.entity[prop.name]._id) {

                    let promise: Promise<Entity> = EntityRepository.getRepositoty(prop.validation.ref.name).then(repo => {
                        return repo.findOne(this.entity[prop.name]._id);
                    });

                    promises.push(promise);

                    promise.then(lkd => {
                        if (lkd == null) {
                            problems.push(new ValidationProblem(prop.name, "linkedEntity",
                                SysMsgs.validation.linkedEntityDoesNotExist,
                                prop.validation.ref.name, this.entity[prop.name]._id));
                        } else {
                            prop.validation.linkedProperties.forEach(lkdProp => {
                                if (!_.isEqual(this.entity[prop.name][lkdProp.name], lkd[lkdProp.name])) {
                                    let p = prop.name + "." + lkdProp.name;
                                    problems.push(new ValidationProblem(p, "linkedValue",
                                        SysMsgs.validation.divergentLinkedValue, p, lkd[lkdProp.name]));
                                }
                            });
                        }
                    });
                }
            });

            Promise.all(promises).then(entity => {
                resolve(problems);
            }).catch(err => reject(err));

        });
    }

    private requireReservedProperties(): ValidationProblem[] {
        let problems: ValidationProblem[] = [];

        _.forOwn(SysProperties, (reqProp, key) => {
            let props = _.filter((<EntityType>this.entity).props, { name: reqProp.name });

            if (props.length == 0)
                problems.push(new ValidationProblem(reqProp.name, "missingRequiredEntityProperty",
                    SysMsgs.validation.missingRequiredEntityProperty, reqProp.name));
            else if (!_.isEqual(props[0], reqProp))
                problems.push(new ValidationProblem(reqProp.name, "invalidRequiredEntityProperty",
                    SysMsgs.validation.invalidRequiredEntityProperty, reqProp.name));

        });

        return problems;
    }
}