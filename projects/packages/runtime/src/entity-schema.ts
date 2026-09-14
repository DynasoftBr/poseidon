import type { EntityProperty } from '@poseidon/models';

export interface JsonSchema {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, PropertySchema>;
    required?: string[];
}

interface PropertySchema {
    type?: string;
    format?: 'date-time';
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
    multipleOf?: number;
    uniqueItems?: boolean;
    items?: PropertySchema;
}

/** Builds JSON Schema from EntityProperty records stored in Poseidon's model. */
export function buildEntitySchema(properties: EntityProperty[]): JsonSchema {
    const required = properties
        .filter((property) => property.data.required)
        .map((property) => property.data.name);

    return {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(
            properties.map((property) => [property.data.name, buildPropertySchema(property)]),
        ),
        ...(required.length > 0 ? { required } : {}),
    };
}

function buildPropertySchema(property: EntityProperty): PropertySchema {
    const schema = {
        ...buildTypeSchema(property),
        ...(property.data.minimum === undefined ? {} : { minimum: property.data.minimum }),
        ...(property.data.maximum === undefined ? {} : { maximum: property.data.maximum }),
        ...(property.data.minLength === undefined ? {} : { minLength: property.data.minLength }),
        ...(property.data.maxLength === undefined ? {} : { maxLength: property.data.maxLength }),
        ...(property.data.pattern === undefined ? {} : { pattern: property.data.pattern }),
        ...(property.data.enum === undefined ? {} : { enum: property.data.enum }),
        ...(property.data.multipleOf === undefined ? {} : { multipleOf: property.data.multipleOf }),
    };

    if (property.data.type !== 'array') return schema;

    return {
        ...schema,
        uniqueItems: property.data.uniqueItems,
        items: { type: toJsonSchemaType(property.data.itemsType ?? 'string') },
    };
}

function buildTypeSchema(property: EntityProperty): Pick<PropertySchema, 'type' | 'format'> {
    if (property.data.type === 'date-time') return { type: 'string', format: 'date-time' };
    if (property.data.type === 'json') return {};
    return { type: toJsonSchemaType(property.data.type) };
}

function toJsonSchemaType(type: EntityProperty['data']['type']): string {
    if (type === 'reference') return 'string';
    if (type === 'array') return 'array';
    return type;
}
