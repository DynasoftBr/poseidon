import {
    propertyConventions,
    propertyTypes,
    type EntityId,
    type EntityProperty,
} from '@poseidon/models';
import { systemEntityTypeNames } from './entity-types';
import { createProperty } from './create-property';

export function createCoreProperties(): EntityProperty[] {
    return [
        ...systemEntityTypeNames.flatMap((entityTypeId) =>
            entityTypeId === 'entity-property'
                ? [createProperty([entityTypeId, '_id', 'string', true])]
                : createSystemProperties(entityTypeId),
        ),
        ...createCoreBusinessProperties(),
    ];
}

function createCoreBusinessProperties(): EntityProperty[] {
    return [
        createProperty(['entity-type', 'name', 'string', true]),
        createProperty(['entity-type', 'label', 'string', true]),
        createProperty(['entity-type', 'structure', 'boolean', false], { default: false }),
        createProperty(['entity-type', 'pluralLabel', 'string', false]),
        createProperty(['entity-type', 'description', 'string', false]),
        createProperty(['entity-type', 'menuLocation', 'string', false]),
        createProperty(['entity-type', 'properties', 'array', true], {
            itemsType: 'object',
        }),
        createProperty(['entity-type', 'actions', 'json', false]),
        createProperty(['entity-property', 'name', 'string', true]),
        createProperty(['entity-property', 'type', 'string', true], {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'required', 'boolean', false]),
        createProperty(['entity-property', 'minimum', 'number', false]),
        createProperty(['entity-property', 'maximum', 'number', false]),
        createProperty(['entity-property', 'minLength', 'integer', false]),
        createProperty(['entity-property', 'maxLength', 'integer', false]),
        createProperty(['entity-property', 'pattern', 'string', false]),
        createProperty(['entity-property', 'enum', 'array', false], {
            itemsType: 'string',
        }),
        createProperty(['entity-property', 'default', 'json', false]),
        createProperty(['entity-property', 'convention', 'string', false], {
            enum: [...propertyConventions],
        }),
        createProperty(['entity-property', 'itemsType', 'string', false], {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'uniqueItems', 'boolean', false]),
        createProperty(['entity-property', 'multipleOf', 'number', false]),
    ];
}

export function createSystemProperties(entityTypeId: EntityId): EntityProperty[] {
    return [createProperty([entityTypeId, '_id', 'string', true])];
}
