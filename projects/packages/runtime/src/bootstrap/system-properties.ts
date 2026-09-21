import {
    propertyConventions,
    propertyTypes,
    type EntityId,
    type EntityProperty,
} from '@poseidon/models';
import { systemEntityTypeNames } from '../system/entity-types';
import { createProperty } from './create-property';
import type { BootstrapContext } from './system-fields';

export function createCoreProperties(context: BootstrapContext): EntityProperty[] {
    return [
        ...systemEntityTypeNames.flatMap((entityTypeId) =>
            entityTypeId === 'entity-property'
                ? [createProperty([entityTypeId, '_id', 'string', true], context)]
                : createSystemProperties(entityTypeId, context),
        ),
        ...createCoreBusinessProperties(context),
    ];
}

function createCoreBusinessProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['entity-type', 'name', 'string', true], context),
        createProperty(['entity-type', 'label', 'string', true], context),
        createProperty(['entity-type', 'structure', 'boolean', false], context, { default: false }),
        createProperty(['entity-type', 'pluralLabel', 'string', false], context),
        createProperty(['entity-type', 'description', 'string', false], context),
        createProperty(['entity-type', 'menuLocation', 'string', false], context),
        createProperty(['entity-type', 'properties', 'array', true], context, {
            itemsType: 'object',
        }),
        createProperty(['entity-type', 'actions', 'json', false], context),
        createProperty(['entity-property', 'name', 'string', true], context),
        createProperty(['entity-property', 'type', 'string', true], context, {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'required', 'boolean', false], context),
        createProperty(['entity-property', 'minimum', 'number', false], context),
        createProperty(['entity-property', 'maximum', 'number', false], context),
        createProperty(['entity-property', 'minLength', 'integer', false], context),
        createProperty(['entity-property', 'maxLength', 'integer', false], context),
        createProperty(['entity-property', 'pattern', 'string', false], context),
        createProperty(['entity-property', 'enum', 'array', false], context, {
            itemsType: 'string',
        }),
        createProperty(['entity-property', 'default', 'json', false], context),
        createProperty(['entity-property', 'convention', 'string', false], context, {
            enum: [...propertyConventions],
        }),
        createProperty(['entity-property', 'itemsType', 'string', false], context, {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'uniqueItems', 'boolean', false], context),
        createProperty(['entity-property', 'multipleOf', 'number', false], context),
        createProperty(['script', 'code', 'string', false], context),
        createProperty(['index', 'entityTypeId', 'string', true], context),
        createProperty(['index', 'name', 'string', true], context),
        createProperty(['index', 'propertyIds', 'array', true], context),
        createProperty(['user', 'name', 'string', true], context),
        createProperty(['user', 'login', 'string', true], context),
        ...createIdentityProperties(context),
    ];
}

export function createSystemProperties(
    entityTypeId: EntityId,
    context: BootstrapContext,
): EntityProperty[] {
    return [
        createProperty([entityTypeId, '_id', 'string', true], context),
        createProperty([entityTypeId, '_entityTypeId', 'string', true], context),
        createProperty([entityTypeId, '_version', 'integer', true], context),
        createProperty([entityTypeId, '_createdAt', 'date-time', true], context),
        createProperty([entityTypeId, '_createdBy', 'string', true], context),
        createProperty([entityTypeId, '_changedAt', 'date-time', false], context),
        createProperty([entityTypeId, '_changedBy', 'string', false], context),
        createProperty([entityTypeId, '_deletedAt', 'date-time', false], context),
        createProperty([entityTypeId, '_deletedBy', 'string', false], context),
    ];
}

function createIdentityProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['identity', 'name', 'string', true], context),
        createProperty(['identity', 'owner', 'string', true], context),
    ];
}
