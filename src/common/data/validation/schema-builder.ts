import * as _ from "lodash";

import { SchemaBuilderObject, SchemaBuilderGeneric, SchemaBuilderCore } from "json-schema-fluent-builder/lib/builders";
import { SchemaBuilder as JsonSchemaBuilder } from "json-schema-fluent-builder/lib";
import {
    Validation, PropertyType, EntityType,
    EntityRepository, SysEntities, EntityProperty
} from "../../";

export class SchemaBuilder {
    /**
     * Builds the schema for the specified entity type.
     */
    static buildSchema(entityType: EntityType): Promise<SchemaBuilderObject> {
        return new Promise((resolve, reject) => {
            // The root schema.
            let schema = new JsonSchemaBuilder().object();
            schema.additionalProperties(false);

            let pLength = entityType.props.length;
            let promises: Promise<SchemaBuilderGeneric>[] = new Array(pLength);

            for (let idx = 0; idx < pLength; idx++) {
                let prop = entityType.props[idx];

                // Builds the validation for current property.
                let bs = this.buildPropertySchema(schema, prop.validation);
                promises[idx] = bs;

                // On promise resolve set the property in the root schema
                bs.then(res => schema.prop(prop.name, res, prop.validation.required));
            }

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
    static buildPropertySchema(rootSchema: SchemaBuilderCore<any>, validation: Validation)
        : Promise<SchemaBuilderGeneric> {

        let propSchema: SchemaBuilderGeneric;
        return new Promise<SchemaBuilderGeneric>((resolve, reject) => {

            // Handle Linked Entity
            if (validation.type === PropertyType.linkedEntity) {
                propSchema = new JsonSchemaBuilder().type("object");
                propSchema.additionalProperties(false);

                // Get's an entity type repository then finds the linked entity type.
                EntityRepository.getRepositoty(SysEntities.entityType).then(etRepo => {
                    return etRepo.findOne(validation.ref._id);

                }).then((lkdEntityType: EntityType) => {
                    let lkdPropsLength = validation.linkedProperties.length;
                    let promises: Promise<SchemaBuilderGeneric>[] = new Array(lkdPropsLength);
                    for (let idx = 0; idx < lkdPropsLength; idx++) {

                        // Find's the linked property in the linked entity type.
                        let foundProp: EntityProperty = _.find(lkdEntityType.props, {
                            name: validation.linkedProperties[idx].name
                        });

                        // Call buildPropertySchema recursively to build schema,
                        // and add the returned promise to the array to wait for it.
                        let bsPromise = this.buildPropertySchema(rootSchema, foundProp.validation);
                        promises[idx] = bsPromise;

                        // When promises resolve add the property to the schema.
                        bsPromise.then(schema => {
                            propSchema.prop(foundProp.name, schema, foundProp.validation.required);
                        });
                    }

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
                    let definition = new JsonSchemaBuilder().object();
                    rootSchema.definitions(validation.ref.name, definition);

                    definition.additionalProperties(false);

                    EntityRepository.getRepositoty(SysEntities.entityType).then(etRepo => {
                        return etRepo.findOne(validation.ref._id);

                    }).then((abstractEtType: EntityType) => {

                        let absPropsLength = abstractEtType.props.length;
                        let promises: Promise<SchemaBuilderGeneric>[] = new Array(absPropsLength);

                        for (let idx = 0; idx < absPropsLength; idx++) {
                            let absProp = abstractEtType.props[idx];
                            let bsPromise = this.buildPropertySchema(rootSchema, absProp.validation);

                            promises[idx] = bsPromise;

                            bsPromise.then(schema => {
                                definition.prop(absProp.name, schema, absProp.validation.required);
                            });
                        }

                        Promise.all(promises).then(res => {
                            resolve(propSchema);
                        }).catch(err => {
                            reject(err);
                        });
                    });
                }

            } else if (validation.type === PropertyType.array) {
                propSchema = new JsonSchemaBuilder().type("array");
                propSchema.additionalItems(false);
                if (validation.uniqueItems)
                    propSchema.uniqueItems(true);

                this.buildPropertySchema(rootSchema, validation.items)
                    .then(res => {
                        propSchema.items(res);
                        resolve(propSchema);
                    }).catch(err => {
                        reject(err);
                    });
            }
            else {
                // Handle string.
                if (validation.type === PropertyType.string || validation.type == PropertyType.javascript) {
                    propSchema = new JsonSchemaBuilder().type("string");

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

                    propSchema = new JsonSchemaBuilder().type("boolean");

                    // Handle number and int.
                } else if (validation.type === PropertyType.number ||
                    validation.type === PropertyType.int) {

                    propSchema = new JsonSchemaBuilder()
                        .type(<"integer" | "number">validation.type.toLowerCase());
                    if (validation.min)
                        propSchema.min(validation.min);

                    if (validation.max)
                        propSchema.min(validation.min);

                    if (validation.multipleOf)
                        propSchema.multipleOf(validation.multipleOf);

                    // Handle enum.
                } else if (validation.type === PropertyType.enum) {
                    propSchema = new JsonSchemaBuilder().type("string").enum(...validation.enum);

                }

                resolve(propSchema);
            }
        });
    }
}

