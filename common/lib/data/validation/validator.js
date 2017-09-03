"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Ajv = require("ajv");
const models_1 = require("../../models");
const _1 = require("./");
const entity_repository_1 = require("../entity-repository");
const json_schema_fluent_builder_1 = require("json-schema-fluent-builder");
const builders_1 = require("json-schema-fluent-builder/lib/builders");
const _2 = require("../../");
/**
 * Class responsible for validating the object.
 * @class
 */
class Validator {
    constructor(entityType, entity) {
        this.entityType = entityType;
        this.entity = entity;
    }
    /**
     * Validates an entity against an entity type specification.
     * @param entitytype Entity type to validate against.
     * @param entity Object to be validated
     * @static
     * @func
     */
    static validate(entitytype, entity, isNew) {
        return new Promise((resolve, reject) => {
            let problems = [];
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
                if (validator.entityType.name == models_1.SysEntities.entityType)
                    problems.push(...validator.requireReservedProperties());
                if (problems.length > 0)
                    reject(new _1.ValidationError(problems)); // Rejects with an validation error.
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
    buildSchema() {
        return new Promise((resolve, reject) => {
            // The root schema.
            let schema = new json_schema_fluent_builder_1.SchemaBuilder().object();
            schema.additionalProperties(false);
            let promises = [];
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
    buildSchemaValidation(rootSchema, validation) {
        let propSchema;
        return new Promise((resolve, reject) => {
            // Handle Linked Entity
            if (validation.type === models_1.PropertyType.linkedEntity) {
                propSchema = new json_schema_fluent_builder_1.SchemaBuilder().type("object");
                propSchema.additionalProperties(false);
                let lkdEtType;
                // Get's an entity type repository then finds the linked entity type.
                entity_repository_1.EntityRepository.getRepositoty(models_1.SysEntities.entityType).then(etRepo => {
                    return etRepo.findOne(validation.ref._id);
                }).then((lkdEntityType) => {
                    let promises = [];
                    // Iterate linked properties to build each schema validation
                    validation.linkedProperties.forEach((lkdProp) => {
                        // Find's the linked property in the linked entity type.
                        let foundProp = _.find(lkdEntityType.props, { name: lkdProp.name });
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
            }
            else if (validation.type === models_1.PropertyType.abstractEntity) {
                propSchema = new builders_1.SchemaBuilderGeneric({}).$ref("#/definitions/" + validation.ref.name);
                let definitions = rootSchema.getSchema().definitions;
                if (definitions && definitions[validation.ref.name])
                    resolve(propSchema);
                else {
                    let definition = new json_schema_fluent_builder_1.SchemaBuilder().object();
                    rootSchema.definitions(validation.ref.name, definition);
                    definition.additionalProperties(false);
                    entity_repository_1.EntityRepository.getRepositoty(models_1.SysEntities.entityType).then(etRepo => {
                        return etRepo.findOne(validation.ref._id);
                    }).then((abstractEtType) => {
                        let promises = [];
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
            }
            else if (validation.type === models_1.PropertyType.array) {
                propSchema = new json_schema_fluent_builder_1.SchemaBuilder().type("array");
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
                if (validation.type === models_1.PropertyType.string) {
                    propSchema = new json_schema_fluent_builder_1.SchemaBuilder().type("string");
                    if (validation.min)
                        propSchema.minLength(validation.min);
                    if (validation.max)
                        propSchema.maxLength(validation.max);
                    if (validation.pattern)
                        propSchema.pattern(validation.pattern);
                    // Handle date.
                }
                else if (validation.type === models_1.PropertyType.dateTime) {
                    propSchema = new builders_1.SchemaBuilderGeneric({}).format("date-time");
                    // handle boolean.
                }
                else if (validation.type === models_1.PropertyType.boolean) {
                    propSchema = new json_schema_fluent_builder_1.SchemaBuilder().type("boolean");
                    // Handle number and int.
                }
                else if (validation.type === models_1.PropertyType.number ||
                    validation.type === models_1.PropertyType.int) {
                    propSchema = new json_schema_fluent_builder_1.SchemaBuilder()
                        .type(validation.type.toLowerCase());
                    if (validation.min)
                        propSchema.min(validation.min);
                    if (validation.max)
                        propSchema.min(validation.min);
                    if (validation.multipleOf)
                        propSchema.multipleOf(validation.multipleOf);
                    // Handle enum.
                }
                else if (validation.type === models_1.PropertyType.enum) {
                    propSchema = new json_schema_fluent_builder_1.SchemaBuilder().type("string").enum(...validation.enum);
                }
                resolve(propSchema);
            }
        });
    }
    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    validateJsonSchema(schema) {
        // Instantiates ajv library, compiles the schema, them validates the entity.
        let jsonVal = new Ajv({ allErrors: true, verbose: true });
        let validate = jsonVal.compile(schema);
        let valid = validate(this.entity);
        // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
        if (!valid) {
            let problems = [];
            validate.errors.forEach(err => {
                problems.push(_1.ValidationProblem.buildMsg(err));
            });
            return problems;
        }
        return [];
    }
    validateLinkedEntities() {
        return new Promise((resolve, reject) => {
            let problems = [];
            let promises = [];
            this.entityType.props.forEach((prop) => {
                if (prop.validation.type === models_1.PropertyType.linkedEntity
                    && this.entity[prop.name] && this.entity[prop.name]._id) {
                    let promise = entity_repository_1.EntityRepository.getRepositoty(prop.validation.ref.name).then(repo => {
                        return repo.findOne(this.entity[prop.name]._id);
                    });
                    promises.push(promise);
                    promise.then(lkd => {
                        if (lkd == null) {
                            problems.push(new _1.ValidationProblem(prop.name, "linkedEntity", _2.SysMsgs.validation.linkedEntityDoesNotExist, prop.validation.ref.name, this.entity[prop.name]._id));
                        }
                        else {
                            prop.validation.linkedProperties.forEach(lkdProp => {
                                if (!_.isEqual(this.entity[prop.name][lkdProp.name], lkd[lkdProp.name])) {
                                    let p = prop.name + "." + lkdProp.name;
                                    problems.push(new _1.ValidationProblem(p, "linkedValue", _2.SysMsgs.validation.divergentLinkedValue, p, lkd[lkdProp.name]));
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
    requireReservedProperties() {
        let problems = [];
        _.forOwn(models_1.SysProperties, (reqProp, key) => {
            let props = _.filter(this.entity.props, { name: reqProp.name });
            if (props.length == 0)
                problems.push(new _1.ValidationProblem(reqProp.name, "missingRequiredEntityProperty", _2.SysMsgs.validation.missingRequiredEntityProperty, reqProp.name));
            else if (!_.isEqual(props[0], reqProp))
                problems.push(new _1.ValidationProblem(reqProp.name, "invalidRequiredEntityProperty", _2.SysMsgs.validation.invalidRequiredEntityProperty, reqProp.name));
        });
        return problems;
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map