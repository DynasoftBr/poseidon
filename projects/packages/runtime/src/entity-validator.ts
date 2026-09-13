import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { EntityProperty } from '@poseidon/model';
import type { ValidationProblem } from './poseidon-error';
import { buildEntitySchema } from './entity-schema';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/** Validates entity data against the declarative properties of its EntityType. */
export function validateEntity(
    properties: EntityProperty[],
    data: Record<string, unknown>,
): ValidationProblem[] {
    const validate = ajv.compile(buildEntitySchema(properties));

    if (validate(data)) return [];

    return (validate.errors ?? []).map((error) => ({
        property: error.instancePath || error.params.missingProperty || 'entity',
        message: error.message ?? 'is invalid.',
    }));
}
