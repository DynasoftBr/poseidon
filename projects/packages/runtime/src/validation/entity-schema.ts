import { propertyTypes, type EntityProperty, type EntityTypeDefinition } from '@poseidon/framework';

export interface JsonSchema {
    type: 'object';
    additionalProperties: false;
    properties: Record<string, PropertySchema>;
    required?: string[];
    $defs?: Record<string, JsonSchema>;
}

interface PropertySchema {
    $ref?: string;
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

/**
 * Builds JSON Schema, resolving array item references through the supplied loader.
 * @param {EntityProperty[]} properties - Root property definitions.
 * @param {(id: string) => Promise<EntityType>} loadEntityType - Loads referenced definitions.
 * @returns {Promise<JsonSchema>} Resolves to the schema with referenced definitions.
 * @throws If a referenced definition cannot be loaded.
 */
export async function buildEntitySchema(
    properties: EntityProperty[],
    loadEntityType: (id: string) => Promise<EntityTypeDefinition>,
): Promise<JsonSchema> {
    const definitions: Record<string, JsonSchema> = {};
    const visited = new Set<string>();

    async function includeReferences(fields: EntityProperty[]): Promise<void> {
        for (const field of fields) {
            const id = field.itemsType;
            if (field.type !== 'array' || id === undefined || isPrimitive(id) || visited.has(id)) {
                continue;
            }
            visited.add(id);
            const definition = await loadEntityType(id);
            definitions[id] = buildObjectSchema(definition.properties);
            await includeReferences(definition.properties);
        }
    }

    await includeReferences(properties);
    return { ...buildObjectSchema(properties), $defs: definitions };
}

function buildObjectSchema(properties: EntityProperty[]): JsonSchema {
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

function isPrimitive(type: string): boolean {
    return propertyTypes.some((primitive) => primitive === type);
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
        items: buildItemSchema(property.itemsType ?? 'string'),
    };
}

function buildTypeSchema(property: EntityProperty): Pick<PropertySchema, 'type' | 'format'> {
    if (property.type === 'date-time') return { type: 'string', format: 'date-time' };
    if (property.type === 'json') return {};
    return { type: toJsonSchemaType(property.type) };
}

function toJsonSchemaType(type: EntityProperty['type']): string {
    if (type === 'array') return 'array';
    return type;
}

function buildItemSchema(type: string): PropertySchema {
    if (isPrimitive(type)) {
        if (type === 'json') return {};
        if (type === 'date-time') return { type: 'string', format: 'date-time' };
        return { type };
    }
    return { $ref: `#/$defs/${encodeURIComponent(type.replace(/~/g, '~0').replace(/\//g, '~1'))}` };
}
