import type { EntityProperty } from '@poseidon/model';
import { validateEntity } from './entity-validator';

describe('validateEntity', () => {
    const properties: EntityProperty[] = [
        property({ id: 'person:name', name: 'name', type: 'string', required: true, minLength: 2 }),
        property({ id: 'person:age', name: 'age', type: 'integer', minimum: 0 }),
        property({
            id: 'person:tags',
            name: 'tags',
            type: 'array',
            itemsType: 'string',
            uniqueItems: true,
        }),
        property({ id: 'person:created-at', name: 'createdAt', type: 'date-time' }),
    ];

    it('should accept data that conforms to the EntityType properties', () => {
        expect(
            validateEntity(properties, {
                name: 'Ada',
                age: 36,
                tags: ['mathematician', 'programmer'],
                createdAt: '2026-09-13T12:00:00.000Z',
            }),
        ).toEqual([]);
    });

    it('should reject missing, invalid, and undeclared values', () => {
        const problems = validateEntity(properties, {
            age: -1,
            tags: ['duplicate', 'duplicate'],
            extra: true,
        });

        expect(problems.map((problem) => problem.property)).toEqual(
            expect.arrayContaining(['name', '/age', '/tags', 'entity']),
        );
    });

    it('should accept arbitrary JSON values for a json property', () => {
        const jsonProperty = property({ id: 'person:metadata', name: 'metadata', type: 'json' });

        expect(
            validateEntity([jsonProperty], { metadata: { enabled: false, tags: ['math'] } }),
        ).toEqual([]);
        expect(validateEntity([jsonProperty], { metadata: null })).toEqual([]);
    });
});

function property(
    input: Pick<EntityProperty, 'id' | 'name' | 'type'> & Partial<EntityProperty>,
): EntityProperty {
    return {
        ...input,
        entityTypeId: 'person',
        createdAt: new Date(),
        createdById: 'system',
    };
}
