import type { Entity, EntityData, EntityProperty } from '@poseidon/models';
import type { RuntimeContext } from './runtime-context';
import { getProperties, getActions } from './entity-model-utils';
import { applyDefaultsAndConventions, applyConventions } from './entity-preparation';
import { applyEntityRules } from './entity-rule-engine';
import { validateEntity } from './entity-validator';
import { EntityTypeNotFoundError, ValidationError } from './poseidon-error';
import { createSystemProperties } from './bootstrap-model';

export async function prepareMutation(
    context: RuntimeContext,
    name: string,
    input: EntityData,
    current?: Entity,
): Promise<EntityData> {
    const type = await context.entityType(name);
    if (!type) throw new EntityTypeNotFoundError(name);
    const supplied = Object.fromEntries(
        Object.entries(input).filter(
            ([key]) => !key.startsWith('_') || key === '_id' || key === '_version',
        ),
    );
    let data = { ...current, ...supplied };
    if (name === 'entity-type') data = prepareEntityType(context, data, current);
    const properties = getProperties(type);
    data = current
        ? applyConventions(data, properties)
        : applyDefaultsAndConventions(data, properties);
    data = applyEntityRules(getActions(type), current ? 'update' : 'create', properties, data);
    await prepareStructures(context, properties, data);
    const fields = properties.filter((field) => !field.name.startsWith('_'));
    const businessData = Object.fromEntries(
        Object.entries(data).filter(([key]) => !key.startsWith('_')),
    );
    const problems = validateEntity(fields, businessData);
    if (problems.length) throw new ValidationError(problems);
    return data;
}

async function prepareStructures(
    context: RuntimeContext,
    properties: EntityProperty[],
    data: EntityData,
): Promise<void> {
    for (const field of properties) {
        if (!field.relatedEntityTypeId || data[field.name] === undefined) continue;
        const structure = await context.storage.get('entity-type', field.relatedEntityTypeId);
        if (!structure?.structure) continue;
        await prepareStructureValues(context, field, data);
    }
}

async function prepareStructureValues(
    context: RuntimeContext,
    field: EntityProperty,
    data: EntityData,
): Promise<void> {
    const value = data[field.name];
    const values = Array.isArray(value) ? value : [value];
    const prepared = [];
    for (const item of values) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new ValidationError([
                { property: field.name, message: 'Structure values must be objects.' },
            ]);
        }
        prepared.push(await prepareMutation(context, field.relatedEntityTypeId!, item));
    }
    if (
        field.uniqueBy &&
        new Set(prepared.map((item) => JSON.stringify(item[field.uniqueBy!]))).size !==
            prepared.length
    ) {
        throw new ValidationError([
            { property: field.name, message: `Values must be unique by '${field.uniqueBy}'.` },
        ]);
    }
    data[field.name] = Array.isArray(value) ? prepared : prepared[0];
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
