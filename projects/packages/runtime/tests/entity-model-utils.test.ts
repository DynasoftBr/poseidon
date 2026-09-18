import type { Entity } from '@poseidon/models';
import { getActions, getProperties, toProperty } from '../src/entity-model-utils';

describe('entity model utilities', () => {
    it('should reject an entity type without embedded property definitions', () => {
        expect(() => getProperties(projection('person', 'entity-type', {}))).toThrow(
            'The entity is invalid.',
        );
    });
    it('should expose embedded property definitions and optional actions', () => {
        const stored = {
            _id: 'user:name',
            entityTypeId: 'user',
            name: 'name',
            type: 'string',
            required: true,
        };
        expect(toProperty(stored, stored._id)).toEqual(stored);
        expect(getProperties(projection('user', 'entity-type', { properties: [stored] }))).toEqual([
            stored,
        ]);
        expect(getActions(projection('person', 'entity-type', { actions: [] }))).toEqual([]);
        expect(getActions(projection('person', 'entity-type', { actions: {} }))).toBeUndefined();
    });

    it('should reject a missing or invalid property definition', () => {
        expect(() => toProperty(null, 'name')).toThrowError(
            expect.objectContaining({
                problems: [{ property: 'properties', message: "Property 'name' was not found." }],
            }),
        );
        expect(() => toProperty(projection('name', 'person', {}), 'name')).toThrowError(
            expect.objectContaining({
                problems: [{ property: 'properties', message: "Property 'name' was not found." }],
            }),
        );
    });
});

function projection(id: string, entityTypeId: string, data: Record<string, unknown>): Entity {
    return {
        ...data,
        _id: id,
        _entityTypeId: entityTypeId,
        _version: 1,
        _createdAt: new Date().toISOString(),
        _createdBy: 'system',
    };
}
