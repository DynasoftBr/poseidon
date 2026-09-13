import type {
    EntityCommand,
    EntityCommandOperation,
    EntityProperty,
    ComparisonOperator,
    RuleConsequence,
    Specification,
} from '@poseidon/model';
import { ValidationError } from './poseidon-error';

/** Evaluates model-defined rules without evaluating code stored in the model. */
export function applyEntityRules(
    commands: EntityCommand[] | undefined,
    operation: EntityCommandOperation,
    properties: EntityProperty[],
    input: Record<string, unknown>,
): Record<string, unknown> {
    const data = { ...input };
    const propertyNames = new Map(properties.map((property) => [property.id, property.name]));

    commands
        ?.filter((command) => command.operation === operation)
        .flatMap((command) => command.rules ?? [])
        .forEach((rule) => {
            if (matches(rule.specification, data, propertyNames)) {
                applyConsequence(rule.consequence, data, propertyNames);
            }
        });

    return data;
}

function matches(
    specification: Specification,
    data: Record<string, unknown>,
    propertyNames: Map<string, string>,
): boolean {
    if (specification.kind === 'and') return every(specification.conditions, data, propertyNames);
    if (specification.kind === 'or') return some(specification.conditions, data, propertyNames);
    if (specification.kind === 'not') return !matches(specification.condition, data, propertyNames);

    const value = data[propertyNames.get(specification.propertyId) ?? ''];
    return compare(value, specification.operator, specification.value);
}

function every(
    conditions: Specification[],
    data: Record<string, unknown>,
    propertyNames: Map<string, string>,
): boolean {
    return conditions.every((condition) => matches(condition, data, propertyNames));
}

function some(
    conditions: Specification[],
    data: Record<string, unknown>,
    propertyNames: Map<string, string>,
): boolean {
    return conditions.some((condition) => matches(condition, data, propertyNames));
}

function compare(value: unknown, operator: ComparisonOperator, expected: unknown): boolean {
    if (operator === 'exists') return (value !== undefined) === expected;
    if (operator === 'equals') return value === expected;
    if (operator === 'not-equals') return value !== expected;
    if (operator === 'greater-than') {
        return numericComparison(value, expected, (left, right) => left > right);
    }
    if (operator === 'less-than') {
        return numericComparison(value, expected, (left, right) => left < right);
    }
    if (operator === 'contains') return contains(value, expected);
    return false;
}

function numericComparison(
    value: unknown,
    expected: unknown,
    compareNumbers: (left: number, right: number) => boolean,
): boolean {
    return (
        typeof value === 'number' && typeof expected === 'number' && compareNumbers(value, expected)
    );
}

function contains(value: unknown, expected: unknown): boolean {
    return typeof value === 'string'
        ? value.includes(String(expected))
        : Array.isArray(value) && value.includes(expected);
}

function applyConsequence(
    consequence: RuleConsequence,
    data: Record<string, unknown>,
    propertyNames: Map<string, string>,
): void {
    if (consequence.kind === 'reject') {
        throw new ValidationError([{ property: 'entity', message: consequence.message }]);
    }

    const propertyName = propertyNames.get(consequence.propertyId);

    if (!propertyName) {
        throw new ValidationError([
            {
                property: 'commands',
                message: `Rule references missing property '${consequence.propertyId}'.`,
            },
        ]);
    }

    data[propertyName] = consequence.value;
}
