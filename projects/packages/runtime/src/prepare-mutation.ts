import type { Entity, EntityData, EntityType } from '@poseidon/models';
import { getProperties } from './entity-model-utils';
import { validateEntity } from './entity-validator';
import { ValidationError } from './poseidon-error';

export function prepareMutation(type: EntityType, input: EntityData, current?: Entity): EntityData {
    const supplied = Object.fromEntries(
        Object.entries(input).filter(([key]) => !key.startsWith('_') || key === '_id'),
    );
    let data = { ...current, ...supplied };
    if (type.name === 'entity-type') data = prepareEntityType(data, current);
    const properties = getProperties(type);
    const fields = properties.filter((field) => !field.name.startsWith('_'));
    const businessData = Object.fromEntries(
        Object.entries(data).filter(([key]) => !key.startsWith('_')),
    );
    const problems = validateEntity(fields, businessData);
    if (problems.length) throw new ValidationError(problems);
    return data;
}

function prepareEntityType(data: EntityData, current?: Entity): EntityData {
    if (typeof data.name !== 'string' || !/^[A-Za-z][A-Za-z0-9-]*$/.test(data.name)) {
        throw new ValidationError([{ property: 'name', message: 'Invalid entity type name.' }]);
    }
    if (current && data.name !== current.name) {
        throw new ValidationError([
            { property: 'name', message: 'Entity type names cannot be changed.' },
        ]);
    }
    return data;
}
