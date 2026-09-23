import {
    EntityProperty as FrameworkEntityProperty,
    EntityTypeDef,
    Property,
    propertyConventions,
    propertyTypes,
    type PropertyConvention,
    type PropertyType,
} from '@poseidon/framework';

@EntityTypeDef({
    label: 'Entity property',
    description: 'Defines a property and its constraints within an entity type.',
    structure: true,
})
export class EntityProperty extends FrameworkEntityProperty {
    @Property({
        type: 'string',
        required: true,
        description: 'Property name within its entity type.',
    })
    override name!: string;

    @Property({ type: 'string', description: 'Explains what this property represents.' })
    override description?: string;

    @Property({
        type: 'string',
        required: true,
        enum: [...propertyTypes],
        description: 'Type of value accepted by this property.',
    })
    override type!: PropertyType;

    @Property({ type: 'boolean', description: 'Whether a value must be supplied.' })
    override required?: boolean;

    @Property({ type: 'number', description: 'Minimum accepted numeric value.' })
    override minimum?: number;

    @Property({ type: 'number', description: 'Maximum accepted numeric value.' })
    override maximum?: number;

    @Property({ type: 'integer', description: 'Minimum accepted string length.' })
    override minLength?: number;

    @Property({ type: 'integer', description: 'Maximum accepted string length.' })
    override maxLength?: number;

    @Property({ type: 'string', description: 'Regular expression that string values must match.' })
    override pattern?: string;

    @Property({ type: 'array', itemsType: 'string', description: 'Allowed string values.' })
    override enum?: string[];

    @Property({ type: 'json', description: 'Value used when the property is omitted.' })
    override default?: unknown;

    @Property({
        type: 'string',
        enum: [...propertyConventions],
        description: 'Text normalization applied to the value.',
    })
    override convention?: PropertyConvention;

    @Property({ type: 'boolean', description: 'Whether the value is base64 encoded.' })
    override base64Encoded?: boolean;

    @Property({
        type: 'string',
        description: 'Primitive type or entity-type ID accepted for each array item.',
    })
    override itemsType?: string;

    @Property({ type: 'boolean', description: 'Whether array items must be unique.' })
    override uniqueItems?: boolean;

    @Property({ type: 'number', description: 'Number that numeric values must be a multiple of.' })
    override multipleOf?: number;
}
