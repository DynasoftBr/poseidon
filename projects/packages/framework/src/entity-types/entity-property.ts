import type { EntityRef } from '@poseidon/utilities';
import { EntityTypeDef, Property } from '../model/decorators';
import type { EntityType } from './entity-type';
import { Entity, type EntityId } from './entity';

export const propertyTypes = [
    'string',
    'number',
    'integer',
    'boolean',
    'date-time',
    'array',
    'object',
    'json',
    'reference',
] as const;

export type PropertyType = (typeof propertyTypes)[number];

export const propertyConventions = ['lower-case', 'upper-case', 'capitalize-first-letter'] as const;

export type PropertyConvention = (typeof propertyConventions)[number];

export const onDeleteBehaviors = ['restrict', 'detach', 'cascade'] as const;

export type OnDeleteBehavior = (typeof onDeleteBehaviors)[number];

export type RelationshipCardinality = 'one' | 'many';

/**
 * Definition of a property declared by an EntityType.
 * @extends {Entity}
 */
@EntityTypeDef({
    label: 'Entity property',
    description: 'Defines a property and its constraints within an entity type.',
})
export class EntityProperty extends Entity {
    /** Name of this property within its EntityType. */
    @Property({
        type: 'string',
        required: true,
        description: 'Property name within its entity type.',
    })
    name!: string;

    /** Explains what this property represents. */
    @Property({ type: 'string', description: 'Explains what this property represents.' })
    description?: string;

    /** Type of value accepted by this property. */
    @Property({
        type: 'string',
        required: true,
        enum: [...propertyTypes],
        description: 'Type of value accepted by this property.',
    })
    type!: PropertyType;

    /** Whether a value must be supplied. */
    @Property({ type: 'boolean', description: 'Whether a value must be supplied.' })
    required?: boolean;

    /** Minimum accepted numeric value. */
    @Property({ type: 'number', description: 'Minimum accepted numeric value.' })
    minimum?: number;

    /** Maximum accepted numeric value. */
    @Property({ type: 'number', description: 'Maximum accepted numeric value.' })
    maximum?: number;

    /** Minimum accepted string length. */
    @Property({ type: 'integer', description: 'Minimum accepted string length.' })
    minLength?: number;

    /** Maximum accepted string length. */
    @Property({ type: 'integer', description: 'Maximum accepted string length.' })
    maxLength?: number;

    /** Regular expression that accepted strings must match. */
    @Property({ type: 'string', description: 'Regular expression that string values must match.' })
    pattern?: string;

    /** Allowed string values. */
    @Property({ type: 'array', itemsType: 'string', description: 'Allowed string values.' })
    enum?: string[];

    /** Value used when this property is omitted. */
    @Property({ type: 'json', description: 'Value used when the property is omitted.' })
    default?: unknown;

    /** Text normalization applied to this property's value. */
    @Property({
        type: 'string',
        enum: [...propertyConventions],
        description: 'Text normalization applied to the value.',
    })
    convention?: PropertyConvention;

    /** Whether the value is base64 encoded. */
    @Property({ type: 'boolean', description: 'Whether the value is base64 encoded.' })
    base64Encoded?: boolean;

    /** Primitive property type or EntityType ID accepted for each array item. */
    @Property({
        type: 'string',
        description: 'Primitive type or entity-type ID accepted for each array item.',
    })
    itemsType?: PropertyType | EntityId;

    /** Whether array items must be unique. */
    @Property({ type: 'boolean', description: 'Whether array items must be unique.' })
    uniqueItems?: boolean;

    /** Number that numeric values must be a multiple of. */
    @Property({ type: 'number', description: 'Number that numeric values must be a multiple of.' })
    multipleOf?: number;

    /** Entity type referenced by this relationship property. */
    @Property({ type: 'reference', description: 'Entity type referenced by this relationship.' })
    targetEntityType?: EntityRef<EntityType>;

    /** Reciprocal EntityProperty for this relationship. */
    @Property({ type: 'reference', description: 'Reciprocal property for this relationship.' })
    inverseProperty?: EntityRef<EntityProperty>;

    /** Nested path to the reciprocal property before IDs are resolved. */
    @Property({
        type: 'array',
        itemsType: 'string',
        description: 'Nested path to the inverse property.',
    })
    inversePath?: string[];

    /** Whether this endpoint permits one or many relationship records. */
    @Property({
        type: 'string',
        enum: ['one', 'many'],
        description: 'Relationship endpoint cardinality.',
    })
    cardinality?: RelationshipCardinality;

    /** Behavior when the record at this endpoint is deleted. */
    @Property({
        type: 'string',
        enum: [...onDeleteBehaviors],
        description: 'Behavior when the record at this endpoint is deleted.',
    })
    onDelete?: OnDeleteBehavior;
}
