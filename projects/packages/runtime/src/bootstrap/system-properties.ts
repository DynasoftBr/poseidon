import {
    propertyConventions,
    propertyTypes,
    relationKinds,
    type EntityId,
    type EntityProperty,
} from '@poseidon/models';
import { createProperty } from './create-property';
import { coreEntityTypeNames } from './system-entity-types';
import type { BootstrapContext } from './system-fields';

export function createCoreProperties(context: BootstrapContext): EntityProperty[] {
    return [
        ...coreEntityTypeNames.flatMap((entityTypeId) =>
            createSystemProperties(entityTypeId, context),
        ),
        ...createCoreBusinessProperties(context),
    ];
}

function createCoreBusinessProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['entity-type', 'name', 'string', true], context),
        createProperty(['entity-type', 'label', 'string', true], context),
        createProperty(['entity-type', 'pluralLabel', 'string', false], context),
        createProperty(['entity-type', 'description', 'string', false], context),
        createProperty(['entity-type', 'menuLocation', 'string', false], context),
        createProperty(['entity-type', 'properties', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'entity-property',
            uniqueBy: 'name',
        }),
        createProperty(['entity-type', 'commands', 'json', false], context),
        createProperty(['entity-property', 'entityTypeId', 'reference', true], context, {
            relatedEntityTypeId: 'entity-type',
        }),
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
        createProperty(['entity-property', 'relatedEntityTypeId', 'reference', false], context, {
            relatedEntityTypeId: 'entity-type',
        }),
        createProperty(['entity-property', 'relationKind', 'string', false], context, {
            enum: [...relationKinds],
        }),
        createProperty(['entity-property', 'reversePropertyId', 'reference', false], context, {
            relatedEntityTypeId: 'entity-property',
        }),
        createProperty(['entity-property', 'itemsType', 'string', false], context, {
            enum: [...propertyTypes],
        }),
        createProperty(['entity-property', 'uniqueItems', 'boolean', false], context),
        createProperty(['entity-property', 'uniqueBy', 'string', false], context),
        createProperty(['entity-property', 'multipleOf', 'number', false], context),
        createProperty(['index', 'entityTypeId', 'reference', true], context),
        createProperty(['index', 'name', 'string', true], context),
        createProperty(['index', 'propertyIds', 'array', true], context),
        createProperty(['user', 'name', 'string', true], context),
        createProperty(['user', 'login', 'string', true], context),
        ...createIdentityProperties(context),
        createProperty(['relation-link', 'relationPropertyId', 'string', true], context),
        createProperty(['relation-link', 'thisId', 'string', true], context),
        createProperty(['relation-link', 'thatId', 'string', true], context),
    ];
}

export function createSystemProperties(
    entityTypeId: EntityId,
    context: BootstrapContext,
): EntityProperty[] {
    return [
        createProperty([entityTypeId, '_id', 'string', true], context),
        createProperty([entityTypeId, '_entityTypeId', 'reference', true], context, {
            relatedEntityTypeId: 'entity-type',
        }),
        createProperty([entityTypeId, '_version', 'integer', true], context),
        createProperty([entityTypeId, '_createdAt', 'date-time', true], context),
        createProperty([entityTypeId, '_createdBy', 'reference', true], context, {
            relatedEntityTypeId: 'user',
        }),
        createProperty([entityTypeId, '_changedAt', 'date-time', false], context),
        createProperty([entityTypeId, '_changedBy', 'reference', false], context, {
            relatedEntityTypeId: 'user',
        }),
        createProperty([entityTypeId, '_deletedAt', 'date-time', false], context),
        createProperty([entityTypeId, '_deletedBy', 'reference', false], context, {
            relatedEntityTypeId: 'user',
        }),
    ];
}

function createIdentityProperties(context: BootstrapContext): EntityProperty[] {
    return [
        createProperty(['identity', 'name', 'string', true], context),
        createProperty(['identity', 'owner', 'reference', true], context, {
            relatedEntityTypeId: 'user',
            relationKind: 'belongs-to-one',
        }),
        createProperty(['identity', 'members', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'identity',
            relationKind: 'has-many',
            reversePropertyId: 'identity:memberOf',
            uniqueItems: true,
        }),
        createProperty(['identity', 'memberOf', 'array', true], context, {
            itemsType: 'reference',
            relatedEntityTypeId: 'identity',
            relationKind: 'belongs-to-many',
            reversePropertyId: 'identity:members',
            uniqueItems: true,
        }),
    ];
}
