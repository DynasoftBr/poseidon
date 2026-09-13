import Ajv from 'ajv';
import {
    comparisonOperators,
    type EntityData,
    type Specification,
    type ComparisonOperator,
} from '@poseidon/model';
import { ValidationError } from './poseidon-error';

const validateShape = new Ajv({ allowUnionTypes: true }).compile({
    $ref: '#/$defs/specification',
    $defs: {
        specification: {
            oneOf: [
                {
                    type: 'object',
                    additionalProperties: false,
                    required: ['kind', 'propertyId', 'operator', 'value'],
                    properties: {
                        kind: { const: 'comparison' },
                        propertyId: { type: 'string' },
                        operator: { enum: comparisonOperators },
                        value: { type: ['string', 'number', 'boolean', 'null'] },
                    },
                },
                {
                    type: 'object',
                    additionalProperties: false,
                    required: ['kind', 'conditions'],
                    properties: {
                        kind: { enum: ['and', 'or'] },
                        conditions: { type: 'array', items: { $ref: '#/$defs/specification' } },
                    },
                },
                {
                    type: 'object',
                    additionalProperties: false,
                    required: ['kind', 'condition'],
                    properties: {
                        kind: { const: 'not' },
                        condition: { $ref: '#/$defs/specification' },
                    },
                },
            ],
        },
    },
});

export function validateSpecification(
    specification: unknown,
    propertyNames: ReadonlyMap<string, string>,
): asserts specification is Specification {
    if (!validateShape(specification)) {
        invalid('Invalid specification structure or comparison value.');
    }
    validateConditions(specification as Specification, propertyNames);
}

function validateConditions(
    specification: Specification,
    propertyNames: ReadonlyMap<string, string>,
): void {
    if (specification.kind === 'not') {
        return validateConditions(specification.condition, propertyNames);
    }
    if (specification.kind !== 'comparison') {
        specification.conditions.forEach((condition) =>
            validateConditions(condition, propertyNames),
        );
        return;
    }
    const name = propertyNames.get(specification.propertyId);
    if (!name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
        invalid(
            `Specification references an unknown or unsupported property '${specification.propertyId}'.`,
        );
    }
    if (specification.operator === 'exists' && typeof specification.value !== 'boolean') {
        invalid('The exists operator requires a boolean value.');
    }
    if (
        (specification.operator === 'greater-than' || specification.operator === 'less-than') &&
        typeof specification.value !== 'number'
    ) {
        invalid('Numeric comparisons require a number.');
    }
}

function invalid(message: string): never {
    throw new ValidationError([{ property: 'specification', message }]);
}

export function matchesSpecification(
    specification: Specification,
    data: EntityData,
    propertyNames: ReadonlyMap<string, string>,
): boolean {
    if (specification.kind === 'and') {
        return specification.conditions.every((condition) =>
            matchesSpecification(condition, data, propertyNames),
        );
    }
    if (specification.kind === 'or') {
        return specification.conditions.some((condition) =>
            matchesSpecification(condition, data, propertyNames),
        );
    }
    if (specification.kind === 'not') {
        return !matchesSpecification(specification.condition, data, propertyNames);
    }
    const name = propertyNames.get(specification.propertyId);
    if (!name) invalid(`Specification references unknown property '${specification.propertyId}'.`);
    const value = Object.hasOwn(data, name) ? data[name] : undefined;
    return compare(value, specification.operator, specification.value);
}

function compare(value: unknown, operator: ComparisonOperator, expected: unknown): boolean {
    switch (operator) {
        case 'exists':
            return (value !== undefined) === expected;
        case 'equals':
            return value === expected;
        case 'not-equals':
            return value !== expected;
        case 'greater-than':
            return numericComparison(value, expected, (left, right) => left > right);
        case 'less-than':
            return numericComparison(value, expected, (left, right) => left < right);
        case 'contains':
            return contains(value, expected);
    }
}

function numericComparison(
    value: unknown,
    expected: unknown,
    comparison: (left: number, right: number) => boolean,
): boolean {
    return typeof value === 'number' && typeof expected === 'number' && comparison(value, expected);
}

function contains(value: unknown, expected: unknown): boolean {
    return typeof value === 'string'
        ? typeof expected === 'string' && value.includes(expected)
        : Array.isArray(value) && value.includes(expected);
}
