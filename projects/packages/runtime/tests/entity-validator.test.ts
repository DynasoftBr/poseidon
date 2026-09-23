import type { EntityProperty, EntityTypeDefinition } from '@poseidon/framework';
import { validateEntity } from '../src/validation/entity-validator';

describe('validateEntity', () => {
    const loadEntityType = vi.fn<(id: string) => Promise<EntityTypeDefinition>>();
    it('should validate nested references while loading each definition once', async () => {
        const node: EntityTypeDefinition = {
            _id: 'tree-node',
            name: 'tree-node',
            label: 'Node',
            structure: true,
            properties: [
                property({ name: 'name', type: 'string', required: true }),
                property({
                    name: 'children',
                    type: 'array',
                    itemsType: 'tree-node',
                }),
            ],
        };
        const load = vi.fn(() => Promise.resolve(node));
        const fields = [property({ name: 'roots', type: 'array', itemsType: node._id })];
        expect(
            await validateEntity(
                fields,
                { roots: [{ name: 'root', children: [{ name: 'leaf' }] }] },
                load,
            ),
        ).toEqual([]);
        expect(load).toHaveBeenCalledTimes(1);
        expect(
            await validateEntity(fields, { roots: [{ name: 'root', children: [{}] }] }, load),
        ).toEqual([expect.objectContaining({ property: '/roots/0/children/0' })]);
    });

    const properties: EntityProperty[] = [
        property({ name: 'name', type: 'string', required: true, minLength: 2 }),
        property({ name: 'age', type: 'integer', minimum: 0 }),
        property({
            name: 'tags',
            type: 'array',
            itemsType: 'string',
            uniqueItems: true,
        }),
        property({ name: 'createdAt', type: 'date-time' }),
    ];

    it('should accept data that conforms to the EntityType properties', async () => {
        expect(
            await validateEntity(
                properties,
                {
                    name: 'Ada',
                    age: 36,
                    tags: ['mathematician', 'programmer'],
                    createdAt: '2026-09-13T12:00:00.000Z',
                },
                loadEntityType,
            ),
        ).toEqual([]);
    });

    it('should reject missing, invalid, and undeclared values', async () => {
        const problems = await validateEntity(
            properties,
            {
                age: -1,
                tags: ['duplicate', 'duplicate'],
                extra: true,
            },
            loadEntityType,
        );

        expect(problems.map((problem) => problem.property)).toEqual(
            expect.arrayContaining(['name', '/age', '/tags', 'entity']),
        );
    });

    it('should accept arbitrary JSON values for a json property', async () => {
        const jsonProperty = property({ name: 'metadata', type: 'json' });

        expect(
            await validateEntity(
                [jsonProperty],
                { metadata: { enabled: false, tags: ['math'] } },
                loadEntityType,
            ),
        ).toEqual([]);
        expect(await validateEntity([jsonProperty], { metadata: null }, loadEntityType)).toEqual(
            [],
        );
    });
});

function property(
    input: Pick<EntityProperty, 'name' | 'type'> & Partial<EntityProperty>,
): EntityProperty {
    return input;
}
