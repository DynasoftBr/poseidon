import type { EntityId } from './entity';
import { Structure } from './structure';

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

/**
 * Property definition embedded in an EntityType.
 * @extends {Structure}
 */
export class EntityProperty extends Structure {
    /**
     * Name of this property within its EntityType.
     */
    name!: string;

    /**
     * Explains what this property represents.
     */
    description?: string;

    /**
     * Type of value accepted by this property.
     */
    type!: PropertyType;

    /**
     * Whether a value must be supplied.
     */
    required?: boolean;

    /**
     * Minimum accepted numeric value.
     */
    minimum?: number;

    /**
     * Maximum accepted numeric value.
     */
    maximum?: number;

    /**
     * Minimum accepted string length.
     */
    minLength?: number;

    /**
     * Maximum accepted string length.
     */
    maxLength?: number;

    /**
     * Regular expression that accepted strings must match.
     */
    pattern?: string;

    /**
     * Allowed string values.
     */
    enum?: string[];

    /**
     * Value used when this property is omitted.
     */
    default?: unknown;

    /**
     * Text normalization applied to this property's value.
     */
    convention?: PropertyConvention;

    /**
     * Whether the value is base64 encoded.
     */
    base64Encoded?: boolean;

    /**
     * Primitive property type or EntityType ID accepted for each array item.
     */
    itemsType?: PropertyType | EntityId;

    /**
     * Whether array items must be unique.
     */
    uniqueItems?: boolean;

    /**
     * Number that numeric values must be a multiple of.
     */
    multipleOf?: number;
}
