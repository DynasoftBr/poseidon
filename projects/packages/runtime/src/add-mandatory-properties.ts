import type { ActionContext } from './action-context';
import type { DataStorage } from '@poseidon/data-access';
import { getProperties } from './entity-model-utils';
import { createSystemProperties } from './system/system-properties';
import { ValidationError } from './poseidon-error';

export async function addMandatoryProperties(
    { input }: ActionContext,
    storage: DataStorage,
): Promise<null> {
    if (input.properties === undefined) return null;
    if (typeof input._id !== 'string') {
        throw new ValidationError([{ property: '_id', message: 'Entity type ID is required.' }]);
    }
    const current = await storage.get('entity-type', input._id);
    if ((input.structure ?? current?.structure) === true) return null;
    const properties = getProperties({ ...input, _id: input._id });
    const supplied = new Set(properties.map((property) => property._id));
    const mandatory = current
        ? getProperties(current).filter((property) => property.name.startsWith('_'))
        : createSystemProperties(input._id);
    input.properties = [
        ...properties,
        ...mandatory.filter((property) => !supplied.has(property._id)),
    ];
    return null;
}
