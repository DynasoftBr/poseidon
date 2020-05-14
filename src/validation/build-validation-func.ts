import { SchemaModel } from "json-schema-fluent-builder";
import * as Ajv from "ajv";

/**
 * Builds an Ajv.ValidationFunction.
 * @param schema A valid schema model.
 */
export function buildValidationFunc(schema: SchemaModel) {
  const jsonVal = new Ajv({ allErrors: true, verbose: true });
  return jsonVal.compile(schema);
}
