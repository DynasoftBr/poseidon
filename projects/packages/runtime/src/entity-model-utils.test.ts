import type { Entity } from '@poseidon/models';
import { getCommands, toProperty } from './entity-model-utils';

describe('entity model utilities', () => {
    it('should expose valid property projections and optional commands', () => {
        const property = toProperty(
            projection('name', 'entity-property', { name: 'name', type: 'string' }),
            'name',
        );

        expect(property).toMatchObject({
            _id: 'name',
            _entityTypeId: 'entity-property',
            name: 'name',
            type: 'string',
            _version: 1,
        });
        expect(getCommands(projection('person', 'entity-type', { commands: [] }))).toEqual([]);
        expect(getCommands(projection('person', 'entity-type', { commands: {} }))).toBeUndefined();
    });

    it('should retain property version and audit metadata', () => {
        const stored = {
            ...projection('user:name', 'entity-property', {
                entityTypeId: 'user',
                name: 'name',
                type: 'string',
            }),
            _version: 3,
            _changedAt: '2026-09-13T12:00:00.000Z',
            _changedBy: 'editor',
        };

        expect(toProperty(stored, stored._id)).toEqual(stored);
    });

    it('should reject a missing or invalid property projection', () => {
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
