import * as _ from "lodash";
import * as Ajv from "ajv";

import {
    EntityType, EntityProperty, Entity, Validation
} from "../../models";
import { PropertyConvention, PropertyType, SysEntities, SysProperties } from "../../constants";
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

 class Validator implements IEntityValidator {

    /**
     * Validates an entity against an entity type specification.
     * @param entitytype Entity type to validate against.
     * @param entity Object to be validated
     * @static
     * @func
     */
    public async validate(entitytype: EntityType, entity: Entity, isNew: boolean): Promise<ValidationProblem[]> {
        // return new Promise<void>((resolve, reject) => {

        //     let problems: ValidationProblem[] = [];

        //     var schema = EntityRepository.
        //     // builds the schema for the specified entity type.
        //     var schema = this.buildSchema().then(schema => {
        //         // validates the object.
        //         problems.push(...validator.validateJsonSchema(schema.getSchema()));

        //         // Starts linked entity validation.
        //         return validator.validateLinkedEntities();

        //     }).then((messages) => {

        //         problems.push(...messages);

        //         // If it's an entity_type, validate required entity properties.
        //         if (validator.entityType.name == SysEntities.entityType)
        //             problems.push(...validator.requireReservedProperties());

        //         if (problems.length > 0)
        //             reject(new ValidationError(problems)); // Rejects with an validation error.
        //         else
        //             resolve();
        //     }).catch(err => {
        //         reject(err); // This is not expected. Probably and database connection error.
        //     });
        // });

        return [];
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

                    let promise: Promise<Entity> = EntityRepository.createByName(prop.validation.ref.name).then(repo => {
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


}

export interface IEntityValidator {
    validate(entitytype: EntityType, entity: Entity, isNew: boolean): Promise<ValidationProblem[]>;
}

export let EntityValidator: IEntityValidator = new Validator();