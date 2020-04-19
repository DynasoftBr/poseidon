import { ICommandRequest, PartialWithIndex } from "../command-request";
import { IEntity, SysEntities } from "@poseidon/core-models";
import { EntitySchemaBuilder } from "../../../schema-builder/entity-schema-builder";
import { buildValidationFunc } from "../../../validation/build-validation-func";
import { validateEntity } from "../../../validation/validate-entity";
import { ValidateFunction } from "ajv";
import { ValidationError } from "../../../exceptions";
import { PipelineItem } from "../../pipeline-item";
import { IResponse } from "../../response";

const validationFuncs = new Map<string, ValidateFunction>();

/**
 * Validates an entity against it's schema.
 * @param entitytype The entity type of the entity to be validated.
 * @param entity The entity to be validated.
 */
export async function validateSchema<T extends IEntity = IEntity>(
  request: ICommandRequest<T>,
  next: PipelineItem<PartialWithIndex<T>>
): Promise<IResponse> {
  const { context, entityType, payload: content } = request;

  let valFunc = validationFuncs.get(entityType._id);

  if (!valFunc) {
    // find entity schema or build it.
    let schema = null; // (await context.get(SysEntities.entitySchema, { _id: entityType._id }))[0];
    schema = schema || (await new EntitySchemaBuilder(context).buildSchema(entityType)).getSchema();

    // Instantiates ajv library, compiles the schema, them validates the entity.
    valFunc = buildValidationFunc(schema);
    validationFuncs.set(entityType._id, valFunc);
  }

  const problems = validateEntity(valFunc, content);
  if (problems.length > 0) {
    request.response = {
      error: new ValidationError(problems)
    };
  }

  return next(request);
}
