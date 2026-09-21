import type { Entity } from '@poseidon/models';
import { getProperties, requireConcreteEntityType, toProperty } from '../src/entity-model-utils';

describe('entity model utilities', () => {
    it('should reject structures as standalone entity types', () => {
        expect(() =>
            requireConcreteEntityType(projection('address', { name: 'address', structure: true })),
        ).toThrowError(
            expect.objectContaining({
                problems: [
                    {
                        property: 'structure',
                        message: "Structure 'address' cannot be persisted independently.",
                    },
                ],
            }),
        );
        expect(() =>
            requireConcreteEntityType(projection('customer', { name: 'customer' })),
        ).not.toThrow();
    });
    it('should reject an entity type without embedded property definitions', () => {
        expect(() => getProperties(projection('person', {}))).toThrow('The entity is invalid.');
    });
    it('should expose embedded property definitions', () => {
        const stored = {
            _id: 'user:name',
            name: 'name',
            type: 'string',
            required: true,
        };
        expect(toProperty(stored, stored._id)).toEqual(stored);
        expect(getProperties(projection('user', { properties: [stored] }))).toEqual([stored]);
    });

    it('should reject a missing or invalid property definition', () => {
        expect(() => toProperty(null, 'name')).toThrowError(
            expect.objectContaining({
                problems: [{ property: 'properties', message: "Property 'name' was not found." }],
            }),
        );
        expect(() => toProperty(projection('name', {}), 'name')).toThrowError(
            expect.objectContaining({
                problems: [{ property: 'properties', message: "Property 'name' was not found." }],
            }),
        );
    });
});

function projection(id: string, data: Record<string, unknown>): Entity {
    return {
        ...data,
        _id: id,
    };
}
