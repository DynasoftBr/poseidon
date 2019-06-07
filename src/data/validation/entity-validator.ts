import * as Ajv from "ajv";
import _ = require("lodash");
import { SchemaModel } from "json-schema-fluent-builder";
import { EntitySchemaBuilder } from "../../schema-builder/entity-schema-builder";
import { IEntityType, IEntity, SysEntities, PropertyTypes } from "@poseidon/core-models";
import { ValidationProblem, SysMsgs } from "../..//exceptions";
import { IRepositoryFactory } from "../repositories";

export class EntityValidator {

    /**
     * Validates an entity against it's schema.
     * @param entitytype The entity type of the entity to be validated.
     * @param entity The entity to be validated.
     */
    public static async validate(entitytype: IEntityType, entity: IEntity,
        repoFactory: IRepositoryFactory): Promise<ValidationProblem[]> {

        let problems: ValidationProblem[];
        const schemaRepo = await repoFactory.createByName(SysEntities.entitySchema);

        const entitySchema = await schemaRepo.findById(entitytype._id);
        let schema: object;

        // If can't find the schema on database, try to build it.
        if (entitySchema != null)
            schema = JSON.parse(entitySchema.schema);
        else
            schema = (await new EntitySchemaBuilder(await repoFactory.entityType())
                .buildSchema(entitytype)).getSchema();

        // Get schema problems.
        problems = this.validateAgainstJsonSchema(schema, entity);

        // Get linked entity problems.
        problems.push(...await this.validateLinkedEntities(entitytype, entity, repoFactory));

        return problems;
    }

    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private static validateAgainstJsonSchema(schema: SchemaModel, entity: IEntity): ValidationProblem[] {
        // Instantiates ajv library, compiles the schema, them validates the entity.
        const jsonVal = new Ajv({ allErrors: true, verbose: true });
        const validate = jsonVal.compile(schema);
        const valid = validate(entity);

        // If the obj is valid just return an empty array.
        if (valid) return [];

        // if the obj is not valid, builds the messages and returns a 'ValidationProblem' array.
        const problems: ValidationProblem[] = new Array(validate.errors.length);
        validate.errors.forEach((err, idx) => problems[idx] = ValidationProblem.buildMsg(err));

        return problems;
    }

    /**
     * Validates if linked entities has valid references and if its linked property values match the referenced entity values.
     * @param entity The entity to be validated.
     * @param entityType The entity type of the to be validated.
     * @param repoFactory A repository factory
     */
    private static async validateLinkedEntities(entityType: IEntityType, entity: IEntity,
        repoFactory: IRepositoryFactory): Promise<ValidationProblem[]> {

        const problems: ValidationProblem[] = [];
        const propsLength = entityType.props.length;

        // Iterate entity properties.
        for (let idx = 0; idx < propsLength; idx++) {
            const prop = entityType.props[idx];
            const propValidation = prop.validation;

            // Validate only if the entity has a value for this property, the required constraint is validated by json schema.
            if (propValidation.type === PropertyTypes.linkedEntity && entity[prop.name] && entity[prop.name]._id) {

                // Get the repository for the linked entity and try find it.
                const lkdEntity = await (await repoFactory.createByName(propValidation.ref.name)).findById(entity[prop.name]._id);

                // If we can't find an entity with the linked id, add a validation problem.
                if (lkdEntity == null) {
                    problems.push(new ValidationProblem(prop.name, "linkedEntity", SysMsgs.validation.linkedEntityDoesNotExist,
                    propValidation.ref.name, entity[prop.name]._id));
                } else {
                    // Iterate the linked properties and check if it equals the lineked entity values.
                    propValidation.linkedProperties.forEach(lkdProp => {

                        // Check if the value provided in linked properties equals linked entity values.
                        if (!_.isEqual(entity[prop.name][lkdProp.name], lkdEntity[lkdProp.name])) {
                            const p = prop.name + "." + lkdProp.name;
                            problems.push(new ValidationProblem(p, "linkedValue", SysMsgs.validation.divergentLinkedValue, p, lkdEntity[lkdProp.name]));
                        }
                    });
                }
            }
        }

        return problems;
    }
}