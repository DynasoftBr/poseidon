import type { Entity, EntityId } from './entity';

export const propertyTypes = [
    'string',
    'number',
    'integer',
    'boolean',
    'date-time',
    'reference',
    'array',
    'object',
    'json',
] as const;

export type PropertyType = (typeof propertyTypes)[number];

export const propertyConventions = ['lower-case', 'upper-case', 'capitalize-first-letter'] as const;

export type PropertyConvention = (typeof propertyConventions)[number];

export const relationKinds = ['has-one', 'belongs-to-one', 'has-many', 'belongs-to-many'] as const;

export type RelationKind = (typeof relationKinds)[number];

export type EntityProperty = Entity<EntityPropertyData>;

export type EntityPropertyData = {
    entityTypeId: EntityId;
    name: string;
    type: PropertyType;
    required?: boolean;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
    default?: unknown;
    convention?: PropertyConvention;
    base64Encoded?: boolean;
    relatedEntityTypeId?: EntityId;
    relationKind?: RelationKind;
    reversePropertyId?: EntityId;
    itemsType?: PropertyType;
    uniqueItems?: boolean;
    multipleOf?: number;
    uniqueBy?: string;
};
