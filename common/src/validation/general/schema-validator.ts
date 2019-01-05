import * as Ajv from "ajv";
import { EntityValidator } from "../entity-validator";
import { ConcreteEntity, EntityType } from "../../models";
import { ValidationProblem } from "../../validation/validation-problem";
import { SchemaModel } from "json-schema-fluent-builder";
import { AbstractRepositoryFactory } from "../../data/repositories";
import { SysEntities } from "../../constants";
import { EntitySchemaBuilder } from "../../schema-builder/entity-schema-builder";

export class SchemaValidator implements EntityValidator {

    constructor(
        private readonly entityType: EntityType,
        private readonly repoFactory: AbstractRepositoryFactory) { }

    /**
     * Validates an entity against it's schema.
     * @param entitytype The entity type of the entity to be validated.
     * @param entity The entity to be validated.
     */
    public async validate(entity: ConcreteEntity): Promise<ValidationProblem[]> {

        const schemaRepo = await this.repoFactory.createByName(SysEntities.entitySchema);

        const entitySchema = await schemaRepo.findById(this.entityType._id);
        let schema: SchemaModel;

        // If can't find the schema on database, try to build it.
        if (entitySchema != null)
            schema = JSON.parse(entitySchema.schema);
        else
            schema = (await new EntitySchemaBuilder(await this.repoFactory.entityType())
                .buildSchema(this.entityType)).getSchema();

        // Get schema problems and return it.
        return this.validateAgainstJsonSchema(schema, entity);
    }

    /**
     * Validates the entity against the specified schema.
     * @param schema The schema to validate the entity against.
     */
    private validateAgainstJsonSchema(schema: SchemaModel, entity: ConcreteEntity): ValidationProblem[] {
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
}