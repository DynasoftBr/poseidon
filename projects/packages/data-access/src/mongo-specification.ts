import type { Specification } from '@poseidon/models';

export function toMongoSpecification(
    specification: Specification,
    propertyNames: ReadonlyMap<string, string>,
): Record<string, unknown> {
    if (specification.kind === 'and' || specification.kind === 'or') {
        return {
            [specification.kind === 'and' ? '$and' : '$or']: specification.conditions.map(
                (condition) => toMongoSpecification(condition, propertyNames),
            ),
        };
    }
    if (specification.kind === 'not') {
        return { $not: [toMongoSpecification(specification.condition, propertyNames)] };
    }
    const name = propertyNames.get(specification.propertyId);
    if (!name || !/^_?[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`Invalid specification property '${specification.propertyId}'.`);
    }
    return comparisonExpression(specification, `$${name}`);
}

function comparisonExpression(
    specification: Extract<Specification, { kind: 'comparison' }>,
    field: string,
): Record<string, unknown> {
    const value = { $literal: specification.value };
    const exists = { $ne: [{ $type: field }, 'missing'] };
    const equals = { $and: [exists, { $eq: [field, value] }] };
    switch (specification.operator) {
        case 'exists':
            return specification.value ? exists : { $not: [exists] };
        case 'equals':
            return equals;
        case 'not-equals':
            return { $not: [equals] };
        case 'greater-than':
        case 'less-than':
            return {
                $and: [
                    { $isNumber: field },
                    { [specification.operator === 'greater-than' ? '$gt' : '$lt']: [field, value] },
                ],
            };
        case 'contains':
            return containmentExpression(field, specification.value);
    }
}

function containmentExpression(
    field: string,
    expected: string | number | boolean | null,
): Record<string, unknown> {
    const value = { $literal: expected };
    return {
        $cond: [
            { $isArray: field },
            { $in: [value, field] },
            {
                $cond: [
                    { $eq: [{ $type: field }, 'string'] },
                    typeof expected === 'string'
                        ? { $gte: [{ $indexOfCP: [field, value] }, 0] }
                        : false,
                    false,
                ],
            },
        ],
    };
}
