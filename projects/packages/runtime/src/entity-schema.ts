import type { EntityProperty } from '@poseidon/model';

export interface JsonSchema {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, PropertySchema>;
    required?: string[];
}

interface PropertySchema {
    type: string;
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
        .filter((property) => property.required)
        .map((property) => property.name);

    return {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(
            properties.map((property) => [property.name, buildPropertySchema(property)]),
        ),
        ...(required.length > 0 ? { required } : {}),
    };
}

function buildPropertySchema(property: EntityProperty): PropertySchema {
    const schema = {
        ...buildTypeSchema(property),
        ...(property.minimum === undefined ? {} : { minimum: property.minimum }),
        ...(property.maximum === undefined ? {} : { maximum: property.maximum }),
        ...(property.minLength === undefined ? {} : { minLength: property.minLength }),
        ...(property.maxLength === undefined ? {} : { maxLength: property.maxLength }),
        ...(property.pattern === undefined ? {} : { pattern: property.pattern }),
        ...(property.enum === undefined ? {} : { enum: property.enum }),
        ...(property.multipleOf === undefined ? {} : { multipleOf: property.multipleOf }),
    };

    if (property.type !== 'array') return schema;

    return {
        ...schema,
        uniqueItems: property.uniqueItems,
        items: { type: toJsonSchemaType(property.itemsType ?? 'string') },
    };
}

function buildTypeSchema(property: EntityProperty): Pick<PropertySchema, 'type' | 'format'> {
    if (property.type === 'date-time') return { type: 'string', format: 'date-time' };
    return { type: toJsonSchemaType(property.type) };
}

function toJsonSchemaType(type: EntityProperty['type']): string {
    if (type === 'reference') return 'string';
    if (type === 'array') return 'array';
    return type;
}
