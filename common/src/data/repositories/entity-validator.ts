import * as Ajv from "ajv";
import _ = require("lodash");
import { SchemaModel, SchemaBuilder } from "json-schema-fluent-builder";

import { ValidationProblem } from "./validation-problem";
import { EntityType, Entity } from "../../models";
import { AbstractRepositoryFactory } from "./factories/abstract-repository-factory";
import { SysEntities, PropertyTypes } from "../../constants";
import { SysMsgs } from "../../sys-msgs";
import { EntitySchemaBuilder } from "../schema-builder/entity-schema-builder";
import { RepositoryFactory } from "./factories/repository-factory";

export class EntityValidator {

    /**
     * Validates an entity against it's schema.
     * @param entitytype The entity type of the entity to be validated.
     * @param entity The entity to be validated.
     */
    public static async validate(entitytype: EntityType, entity: Entity,
        repoFactory: AbstractRepositoryFactory): Promise<ValidationProblem[]> {

        let problems: ValidationProblem[] = [];
        let schemaRepo = await repoFactory.createByName(SysEntities.entitySchema);

        let entitySchema = await schemaRepo.findById(entitytype.name);
        let schema: object;

        // If can't find the schema on database, try to build it.
        if (entitySchema != null)
            schema = JSON.parse(entitySchema.schema);
        else
            schema = (await new EntitySchemaBuilder(await repoFactory.entityType()).buildSchema(entitytype))
                .getSchema();

        // Get schema problems.
        problems.push(...this.validateAgainstJsonSchema(schema, entity));

        // Get linked entity problems.
        problems.push(...await this.validateLinkedEntities(entity, entitytype, repoFactory));

        return problems;
    }

    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private static validateAgainstJsonSchema(schema: SchemaModel, entity: Entity): ValidationProblem[] {
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

    /**
     * Validates if linked entities has valid references and if its linked property values match the referenced entity values.
     * @param entity The entity to be validated.
     * @param entityType The entity type of the to be validated.
     * @param repoFactory A repository factory
     */
    private static async validateLinkedEntities(entity: Entity, entityType: EntityType,
        repoFactory: AbstractRepositoryFactory): Promise<ValidationProblem[]> {

        let problems: ValidationProblem[] = [];
        let propsLength = entityType.props.length;

        // Iterate entity properties.
        for (let idx = 0; idx < propsLength; idx++) {
            const prop = entityType.props[idx];

            // Validate only if the entity has a value for this property, the required constraint is validated by json schema.
            if (prop.validation.type === PropertyTypes.linkedEntity && entity[prop.name] && entity[prop.name]._id) {

                // Get the repository for the linked entity and try find it.
                let lkdEntity = await (await repoFactory.createByName(prop.validation.ref.name)).findById(entity[prop.name]._id);

                // If we can't find an entity with the linked id, add a validation problem.
                if (lkdEntity == null) {
                    problems.push(new ValidationProblem(prop.name, "linkedEntity", SysMsgs.validation.linkedEntityDoesNotExist,
                        prop.validation.ref.name, entity[prop.name]._id));
                } else {
                    // Iterate the linked properties and check if it equals the lineked entity values.
                    prop.validation.linkedProperties.forEach(lkdProp => {

                        // Check if the value provided in linked properties equals linked entity values.
                        if (!_.isEqual(entity[prop.name][lkdProp.name], lkdEntity[lkdProp.name])) {
                            let p = prop.name + "." + lkdProp.name;
                            problems.push(new ValidationProblem(p, "linkedValue", SysMsgs.validation.divergentLinkedValue, p, lkdEntity[lkdProp.name]));
                        }
                    });
                }
            }
        }

        return problems;
    }
}