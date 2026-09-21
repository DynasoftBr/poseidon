import type { Entity, EntityData, EntityType } from '@poseidon/models';
import type { RuntimeContext } from './runtime-context';
import { getProperties, getActions } from './entity-model-utils';
import { applyDefaultsAndConventions, applyConventions } from './entity-preparation';
import { applyEntityRules } from './entity-rule-engine';
import { validateEntity } from './entity-validator';
import { ValidationError } from './poseidon-error';
import { createSystemProperties } from './bootstrap-model';

export function prepareMutation(
    context: RuntimeContext,
    type: EntityType,
    input: EntityData,
    current?: Entity,
): EntityData {
    const supplied = Object.fromEntries(
        Object.entries(input).filter(
            ([key]) => !key.startsWith('_') || key === '_id' || key === '_version',
        ),
    );
    let data = { ...current, ...supplied };
    if (type.name === 'entity-type') data = prepareEntityType(context, data, current);
    const properties = getProperties(type);
    data = current
        ? applyConventions(data, properties)
        : applyDefaultsAndConventions(data, properties);
    data = applyEntityRules(getActions(type), current ? 'update' : 'create', properties, data);
    const fields = properties.filter((field) => !field.name.startsWith('_'));
    const businessData = Object.fromEntries(
        Object.entries(data).filter(([key]) => !key.startsWith('_')),
    );
    const problems = validateEntity(fields, businessData);
    if (problems.length) throw new ValidationError(problems);
    return data;
}

function prepareEntityType(
    context: RuntimeContext,
    data: EntityData,
    current?: Entity,
): EntityData {
    if (typeof data.name !== 'string' || !/^[A-Za-z][A-Za-z0-9-]*$/.test(data.name)) {
        throw new ValidationError([{ property: 'name', message: 'Invalid entity type name.' }]);
    }
    if (current && data.name !== current.name) {
        throw new ValidationError([
            { property: 'name', message: 'Entity type names cannot be changed.' },
        ]);
    }
    const properties = Array.isArray(data.properties) ? data.properties : [];
    if (data.structure === true) return data;
    const supplied = new Set(properties.map((property) => property._id));
    const mandatory = current
        ? getProperties(current).filter((property) => property.name.startsWith('_'))
        : createSystemProperties(String(data._id ?? data.name), {
              systemUserId: context.user._id,
              now: new Date(),
          });
    return {
        ...data,
        properties: [...properties, ...mandatory.filter((property) => !supplied.has(property._id))],
    };
}
