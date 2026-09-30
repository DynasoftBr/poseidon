import type { ActionContext } from './action-context';
import type { EntityPropertyDefinition, EntityTypeDefinition } from '@poseidon/framework';
import { ValidationError } from '../poseidon-error';
import type { Runtime } from '../runtime';

/**
 * Preserves existing mandatory properties or adds an identifier to a new entity type.
 * @param {ActionContext} context - {@link ActionContext} containing the input to prepare.
 * @param {Runtime} runtime - {@link Runtime} used to persist the definition.
 * @returns {Promise<null>} Promise resolving to null after preparing the property definitions.
 * @throws {@link Error} — If property definitions are supplied without an entity type ID.
 */
export async function addMandatoryProperties(
    { input }: ActionContext,
    runtime: Runtime,
): Promise<null> {
    if (input.properties === undefined) return null;
    if (typeof input._id !== 'string') {
        throw new ValidationError([{ property: '_id', message: 'Entity type ID is required.' }]);
    }
    const current = await runtime.getEntityType<EntityTypeDefinition>(input._id);
    if ((input.structure ?? current?.structure) === true) return null;
    const properties = input.properties as EntityPropertyDefinition[];
    const supplied = new Set(properties.map((property) => property.name));
    const mandatory = current
        ? current.properties.filter((property) => property.name.startsWith('_'))
        : [{ name: '_id', type: 'string' as const, required: true }];
    input.properties = [
        ...properties,
        ...mandatory.filter((property) => !supplied.has(property.name)),
    ];
    return null;
}
