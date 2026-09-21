import type { EntityId } from '../entity';

export const propertyTypes = [
    'string',
    'number',
    'integer',
    'boolean',
    'date-time',
    'array',
    'object',
    'json',
] as const;

export type PropertyType = (typeof propertyTypes)[number];

export const propertyConventions = ['lower-case', 'upper-case', 'capitalize-first-letter'] as const;

export type PropertyConvention = (typeof propertyConventions)[number];

export interface EntityProperty extends EntityPropertyData {
    _id: EntityId;
}

export type EntityPropertyData = {
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
    itemsType?: PropertyType;
    uniqueItems?: boolean;
    multipleOf?: number;
    uniqueBy?: string;
};
