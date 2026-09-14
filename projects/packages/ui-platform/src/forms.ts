import type { Expression, FormDefinition, JsonValue, ValueSchema } from '@poseidon/models';
import { ValidationError } from '@poseidon/runtime';

export function evaluate(
    expression: Expression,
    fields: Record<string, JsonValue>,
    depth = 0,
): JsonValue {
    if (depth > 32) throw new Error('Expression is too deeply nested.');
    if (expression.kind === 'literal') return expression.value;
    if (expression.kind === 'field') return fieldValue(fields, expression.name);
    if (expression.kind === 'if') {
        return evaluate(
            evaluate(expression.condition, fields, depth + 1)
                ? expression.then
                : expression.otherwise,
            fields,
            depth + 1,
        );
    }
    const values = expression.values.map((value) => evaluate(value, fields, depth + 1));
    if (expression.kind === 'concat') return values.map(String).join('');
    if (expression.kind === 'equals') {
        return JSON.stringify(values[0]) === JSON.stringify(values[1]);
    }
    if (!values.every((value) => typeof value === 'number')) {
        throw new Error('Arithmetic requires numbers.');
    }
    return arithmetic(expression.kind, values as number[]);
}
function fieldValue(fields: Record<string, JsonValue>, name: string): JsonValue {
    return fields[name] ?? null;
}
function arithmetic(kind: string, numbers: number[]): number {
    const result = calculate(kind, numbers);
    if (!Number.isFinite(result)) throw new Error('Invalid arithmetic result.');
    return result;
}
function calculate(kind: string, values: number[]): number {
    if (kind === 'add') return values.reduce((a, b) => a + b, 0);
    if (kind === 'multiply') return values.reduce((a, b) => a * b, 1);
    if (values.length !== 2) throw new Error('Operation requires two operands.');
    if (kind === 'subtract') return values[0] - values[1];
    if (kind === 'divide') return values[0] / values[1];
    throw new Error('Unknown expression operation.');
}
export function validateValue(value: unknown, schema: ValueSchema): boolean {
    if (value === undefined) return !schema.required;
    if (schema.type === 'null') return value === null;
    if (schema.type === 'array') return validateArray(value, schema);
    if (schema.type === 'object') return validateObject(value, schema);
    return typeof value === schema.type && (schema.type !== 'number' || Number.isFinite(value));
}
function validateArray(value: unknown, schema: ValueSchema): boolean {
    const items = schema.items;
    return Array.isArray(value) && (!items || value.every((item) => validateValue(item, items)));
}
function validateObject(value: unknown, schema: ValueSchema): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.entries(schema.properties ?? {}).every(([key, child]) =>
        validateValue((value as Record<string, unknown>)[key], child),
    );
}
export function prepareForm(
    form: FormDefinition,
    input: Record<string, JsonValue>,
): Record<string, JsonValue> {
    const fields = { ...input };
    const errors = Object.entries(form.fields)
        .filter(([key, schema]) => !validateValue(fields[key], schema))
        .map(([property]) => ({ property, message: 'Invalid or missing value.' }));
    for (const [key, expression] of Object.entries(form.derived)) {
        fields[key] = evaluate(expression, fields);
    }
    for (const rule of form.validations) {
        if (!evaluate(rule.condition, fields)) {
            errors.push({ property: rule.field, message: rule.message });
        }
    }
    if (errors.length) throw new ValidationError(errors);
    return fields;
}
