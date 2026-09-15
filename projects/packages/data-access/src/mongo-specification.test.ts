import type { Specification } from '@poseidon/models';
import { toMongoSpecification } from './mongo-specification';

const names = new Map([['person:name', 'name']]);
const field = '$name';
const exists = { $ne: [{ $type: field }, 'missing'] };

function comparison(
    operator: Extract<Specification, { kind: 'comparison' }>['operator'],
    value: string | number | boolean | null,
): Specification {
    return { kind: 'comparison', propertyId: 'person:name', operator, value };
}

describe('Mongo specifications', () => {
    it('should compare whole values literally and distinguish missing from null', () => {
        const equals = { $and: [exists, { $eq: [field, { $literal: '$secret' }] }] };
        expect(toMongoSpecification(comparison('equals', '$secret'), names)).toEqual(equals);
        expect(toMongoSpecification(comparison('not-equals', '$secret'), names)).toEqual({
            $not: [equals],
        });
        expect(toMongoSpecification(comparison('exists', true), names)).toEqual(exists);
        expect(toMongoSpecification(comparison('exists', false), names)).toEqual({
            $not: [exists],
        });
    });

    it.each([
        ['greater-than', '$gt'],
        ['less-than', '$lt'],
    ] as const)('should require a numeric field for %s', (operator, mongoOperator) => {
        expect(toMongoSpecification(comparison(operator, 5), names)).toEqual({
            $and: [{ $isNumber: field }, { [mongoOperator]: [field, { $literal: 5 }] }],
        });
    });

    it.each(['.$literal', 3, null])('should guard containment by field type for %j', (value) => {
        expect(toMongoSpecification(comparison('contains', value), names)).toEqual({
            $cond: [
                { $isArray: field },
                { $in: [{ $literal: value }, field] },
                {
                    $cond: [
                        { $eq: [{ $type: field }, 'string'] },
                        typeof value === 'string'
                            ? { $gte: [{ $indexOfCP: [field, { $literal: value }] }, 0] }
                            : false,
                        false,
                    ],
                },
            ],
        });
    });

    it('should translate nested boolean conditions including empty groups', () => {
        expect(
            toMongoSpecification(
                {
                    kind: 'and',
                    conditions: [
                        { kind: 'or', conditions: [] },
                        { kind: 'not', condition: comparison('exists', true) },
                    ],
                },
                names,
            ),
        ).toEqual({ $and: [{ $or: [] }, { $not: [exists] }] });
        expect(toMongoSpecification({ kind: 'and', conditions: [] }, names)).toEqual({ $and: [] });
    });

    it('should reject unknown properties and unsafe field paths', () => {
        expect(() => toMongoSpecification(comparison('equals', 1), new Map())).toThrow();
        expect(() =>
            toMongoSpecification(comparison('equals', 1), new Map([['person:name', '$unsafe']])),
        ).toThrow();
    });
});
