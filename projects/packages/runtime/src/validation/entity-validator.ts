import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { EntityProperty, EntityTypeDefinition } from '@poseidon/framework';
import type { ValidationProblem } from '../poseidon-error';
import { buildEntitySchema } from './entity-schema';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Validates entity data, including referenced array item definitions.
 * @param {EntityProperty[]} properties - Root property definitions.
 * @param {Record<string, unknown>} data - Values to validate.
 * @param {(id: string) => Promise<EntityType>} loadEntityType - Loads referenced definitions.
 * @returns {Promise<ValidationProblem[]>} Resolves to validation problems, or an empty array.
 * @throws If a definition cannot be loaded or compiled.
 */
export async function validateEntity(
    properties: EntityProperty[],
    data: Record<string, unknown>,
    loadEntityType: (id: string) => Promise<EntityTypeDefinition>,
): Promise<ValidationProblem[]> {
    const validate = ajv.compile(await buildEntitySchema(properties, loadEntityType));

    if (validate(data)) return [];

    return (validate.errors ?? []).map((error) => ({
        property: error.instancePath || error.params.missingProperty || 'entity',
        message: error.message ?? 'is invalid.',
    }));
}
