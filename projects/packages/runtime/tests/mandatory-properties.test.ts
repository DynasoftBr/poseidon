import { addMandatoryProperties } from '../src/system-actions/entity-type/add-mandatory-properties';
import { storage } from './context-test-storage';

describe('mandatory entity properties', () => {
    it('should preserve embedded definitions without duplicating mandatory fields', () => {
        const dataStorage = storage([]);
        const existing = {
            _id: 'product:_id',
            entityTypeId: 'product',
            name: '_id',
            type: 'string',
            required: true,
        };
        const result = addMandatoryProperties(
            { _id: 'product', properties: [existing] },
            dataStorage,
            'system',
        );
        expect(result.properties).toContainEqual(existing);
        expect(result.properties).toHaveLength(9);
        expect(dataStorage.create).not.toHaveBeenCalled();
    });

    it('should leave structure fields free of entity metadata', () => {
        const payload = { _id: 'address', structure: true, properties: [] };
        expect(addMandatoryProperties(payload, storage([]), 'system')).toEqual(payload);
    });

    it('should reject missing owners and standalone property references', () => {
        expect(() => addMandatoryProperties({}, storage([]), 'system')).toThrow(
            'The entity is invalid.',
        );
        expect(() =>
            addMandatoryProperties(
                { _id: 'product', properties: ['product:name'] },
                storage([]),
                'system',
            ),
        ).toThrow('The entity is invalid.');
    });
});
