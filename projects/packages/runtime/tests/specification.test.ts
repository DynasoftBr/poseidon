import type { Specification } from '@poseidon/models';
import { matchesSpecification, validateSpecification } from '../src/specification';

const names = new Map([['person:value', 'value']]);

function comparison(
    operator: Extract<Specification, { kind: 'comparison' }>['operator'],
    value: string | number | boolean | null,
): Specification {
    return { kind: 'comparison', propertyId: 'person:value', operator, value };
}

describe('specifications', () => {
    it.each([
        ['equals', 'Ada', 'Ada', true],
        ['equals', 'Ada', ['Ada'], false],
        ['equals', null, undefined, false],
        ['equals', null, null, true],
        ['not-equals', null, undefined, true],
        ['not-equals', 3, 3, false],
        ['exists', true, false, true],
        ['exists', true, null, true],
        ['exists', false, undefined, true],
        ['exists', false, 0, false],
        ['greater-than', 2, 3, true],
        ['greater-than', 2, '3', false],
        ['greater-than', 2, 1, false],
        ['less-than', 2, 1, true],
        ['less-than', 2, null, false],
        ['less-than', 2, 3, false],
        ['contains', 'Ad', 'Ada', true],
        ['contains', '.', 'Ada', false],
        ['contains', '$name', 'the $name field', true],
        ['contains', 3, '123', false],
        ['contains', 'Ada', ['Ada'], true],
        ['contains', 3, ['3'], false],
        ['contains', null, [null], true],
        ['contains', 'Ada', undefined, false],
    ] as const)(
        'should evaluate %s against %j and %j as %s',
        (operator, expected, actual, result) => {
            const condition = comparison(operator, expected);
            validateSpecification(condition, names);
            expect(
                matchesSpecification(
                    condition,
                    actual === undefined ? {} : { value: actual },
                    names,
                ),
            ).toBe(result);
        },
    );

    it('should compose conditions and handle empty conjunctions and disjunctions', () => {
        const condition: Specification = {
            kind: 'and',
            conditions: [
                comparison('exists', true),
                {
                    kind: 'not',
                    condition: {
                        kind: 'or',
                        conditions: [
                            comparison('equals', 'blocked'),
                            comparison('equals', 'closed'),
                        ],
                    },
                },
            ],
        };
        validateSpecification(condition, names);
        expect(matchesSpecification(condition, { value: 'open' }, names)).toBe(true);
        expect(matchesSpecification(condition, { value: 'blocked' }, names)).toBe(false);
        expect(matchesSpecification({ kind: 'and', conditions: [] }, {}, names)).toBe(true);
        expect(matchesSpecification({ kind: 'or', conditions: [] }, {}, names)).toBe(false);
    });

    it.each([
        null,
        {},
        { operator: 'equals', property: 'value', value: 1 },
        { kind: 'and', conditions: [{}] },
        { kind: 'comparison', propertyId: 'person:value', operator: 'unknown', value: 1 },
        {
            kind: 'comparison',
            propertyId: 'person:value',
            operator: 'equals',
            value: { $ne: null },
        },
        comparison('exists', 'yes'),
        comparison('greater-than', '3'),
        comparison('less-than', false),
        {
            kind: 'or',
            conditions: [
                comparison('equals', 1),
                { kind: 'comparison', propertyId: 'foreign:value', operator: 'equals', value: 1 },
            ],
        },
    ])('should reject invalid conditions before evaluation: %j', (condition) => {
        expect(() => validateSpecification(condition, names)).toThrowError(
            expect.objectContaining({ code: 'validation' }),
        );
    });

    it('should reject unsafe field names and unknown properties', () => {
        expect(() =>
            validateSpecification(comparison('equals', 1), new Map([['person:value', '$unsafe']])),
        ).toThrow();
        expect(() => matchesSpecification(comparison('equals', 1), {}, new Map())).toThrow();
    });
});
