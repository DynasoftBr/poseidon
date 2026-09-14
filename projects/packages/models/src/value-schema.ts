export interface ValueSchema {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
    required?: boolean;
    properties?: Record<string, ValueSchema>;
    items?: ValueSchema;
}
