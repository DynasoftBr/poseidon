import { ICommandRequest } from "../command-request";
import { IConcreteEntity, SysEntities } from "@poseidon/core-models";
import { EntitySchemaBuilder } from "../../../schema-builder/entity-schema-builder";
import { buildValidationFunc } from "../../../validation/build-validation-func";
import { validateEntity } from "../../../validation/validate-entity";
import { ValidateFunction } from "ajv";

const validationFuncs = new Map<string, ValidateFunction>();

/**
 * Validates an entity against it's schema.
 * @param entitytype The entity type of the entity to be validated.
 * @param entity The entity to be validated.
 */
export async function validateSchema<T extends IConcreteEntity>(request: ICommandRequest<T>) {

    const { context, entityType, entity } = request;

    const entityTypeRepo = await context.colection(SysEntities.entitySchema);
    const schemaColl = await context.colection(SysEntities.entitySchema);

    // Instantiates ajv library, compiles the schema, them validates the entity.
    let valFunc = validationFuncs.get(entityType._id);
    if (!valFunc) {
        // find entity schema or build it.
        const schema = await schemaColl.findOne({}) || (await new EntitySchemaBuilder(entityTypeRepo)
            .buildSchema(entityType)).getSchema();

        valFunc = buildValidationFunc(schema);
        validationFuncs.set(entityType._id, valFunc);
    }

    // Get schema problems and return it.
    request.problems = [...request.problems, ...validateEntity(valFunc, entity as IConcreteEntity)];
}