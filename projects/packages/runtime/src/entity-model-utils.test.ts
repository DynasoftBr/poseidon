import type { EntityProjection } from '@poseidon/model';
import { getCommands, toProperty } from './entity-model-utils';

describe('entity model utilities', () => {
    it('should expose valid property projections and optional commands', () => {
        const property = toProperty(
            projection('name', 'entity-property', { name: 'name', type: 'string' }),
            'name',
        );

        expect(property).toMatchObject({ id: 'name', name: 'name', type: 'string' });
        expect(getCommands(projection('person', 'entity-type', { commands: [] }))).toEqual([]);
        expect(getCommands(projection('person', 'entity-type', { commands: {} }))).toBeUndefined();
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

function projection(
    id: string,
    entityTypeId: string,
    data: Record<string, unknown>,
): EntityProjection {
    return { id, entityTypeId, data, version: 1, createdAt: new Date(), createdById: 'system' };
}
