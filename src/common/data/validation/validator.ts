import * as _ from "lodash";
import * as Ajv from "ajv";

import {
    EntityType, EntityProperty, Entity, PropertyConvention,
    PropertyType, Validation, SysEntities, SysProperties
} from "../../models";
import { ValidationError, ValidationProblem } from "./";
import { EntityRepository } from "../entity-repository";
import { SysError, SysMsgs } from "../../";
import { SchemaBuilder } from "./schema-builder";
/**
 * Class responsible for validating the object.
 * @class
 */

export class Validator {

    /**
     * Validates an entity against an entity type specification.
     * @param entityType Entity type to validate against.
     * @param entity Object to be validated
     * @static
     * @func
     */
    static validate(entityType: EntityType, entity: Entity, isNew: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            let problems: ValidationProblem[] = [];

            // builds the schema for the specified entity type.
            SchemaBuilder.buildSchema(entityType).then(schema => {
                // validates the object.
                problems.push(...this.validateJsonSchema(entity, schema.getSchema()));

                // Starts linked entity validation.
                return this.validateLinkedEntities(entityType, entity);

            }).then((messages) => {

                problems.push(...messages);

                // If it's an EntityType, validate required entity properties.
                if (entityType.name == SysEntities.entityType)
                    problems.push(...this.requireReservedProperties(<EntityType>entity));

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
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private static validateJsonSchema(entity: Entity, schema: object): ValidationProblem[] {
        // Instantiates ajv library, compiles the schema, them validates the entity.
        let jsonVal = new Ajv({ allErrors: true, verbose: true });
        let validate = jsonVal.compile(schema);
        let valid = validate(entity);

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

    private static validateLinkedEntities(entityType: EntityType, entity: Entity): Promise<ValidationProblem[]> {
        return new Promise<ValidationProblem[]>((resolve, reject) => {

            let problems: ValidationProblem[] = [];

            let propsLength = entityType.props.length;
            let promises: Promise<Entity>[] = new Array(propsLength);

            for (let idx = 0; idx < propsLength; idx++) {
                let prop = entityType.props[idx];

                if (prop.validation.type === PropertyType.linkedEntity
                    && entity[prop.name] && entity[prop.name]._id) {

                    let promise: Promise<Entity> = EntityRepository.getRepositoty(prop.validation.ref.name).then(repo => {
                        return repo.findOne(entity[prop.name]._id);
                    });

                    promises.push(promise);

                    promise.then(lkd => {
                        if (lkd == null) {
                            problems.push(new ValidationProblem(prop.name, "linkedEntity",
                                SysMsgs.validation.linkedEntityDoesNotExist,
                                prop.validation.ref.name, entity[prop.name]._id));
                        } else {
                            let length = prop.validation.linkedProperties.length;

                            for (let idx = 0; idx < length; idx++) {
                                let lkdProp = prop.validation.linkedProperties[idx];

                                if (!_.isEqual(entity[prop.name][lkdProp.name], lkd[lkdProp.name])) {
                                    let p = prop.name + "." + lkdProp.name;
                                    problems.push(new ValidationProblem(p, "linkedValue",
                                        SysMsgs.validation.divergentLinkedValue, p, lkd[lkdProp.name]));
                                }
                            }
                        }
                    });
                }
            }

            Promise.all(promises).then(entity => {
                resolve(problems);
            }).catch(err => reject(err));

        });
    }

    private static requireReservedProperties(entity: EntityType): ValidationProblem[] {
        let problems: ValidationProblem[] = [];

        _.forOwn(SysProperties, (reqProp, key) => {
            let props = _.filter(entity.props, { name: reqProp.name });

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