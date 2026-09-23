import type { ActionContext } from './action-context';
import type { EntityProperty, EntityTypeDefinition } from '@poseidon/framework';
import { ValidationError } from '../poseidon-error';
import type { Runtime } from '../runtime';

export async function addMandatoryProperties(
    { input }: ActionContext,
    runtime: Runtime,
): Promise<null> {
    if (input.properties === undefined) return null;
    if (typeof input._id !== 'string') {
        throw new ValidationError([{ property: '_id', message: 'Entity type ID is required.' }]);
    }
    const current = await runtime.get<EntityTypeDefinition>('entity-type', input._id);
    if ((input.structure ?? current?.structure) === true) return null;
    const properties = input.properties as EntityProperty[];
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
