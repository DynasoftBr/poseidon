import type { Entity } from '@poseidon/models';
import { RuntimeContext } from '../src/runtime-context';

import { entity, entityType, getEntityType, storage } from './context-test-storage';

describe('PoseidonContext', () => {
    it('should read an entity of the requested type', async () => {
        const person = entity('ada', { name: 'Ada' });
        const context = new RuntimeContext(storage({ person: [person] }));

        await expect(context.repository(entityType('person')).get('ada')).resolves.toEqual(person);
        await expect(context.repository(entityType('order')).get('ada')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
        await expect(context.repository(entityType('person')).get('gone')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
    });

    it('should create using the supplied entity type without fetching it again', async () => {
        const dataStorage = storage();
        const context = new RuntimeContext(dataStorage);
        const type = entityType('person', {
            _id: 'person-type-id',
            properties: [
                {
                    _id: 'person:name',
                    name: 'name',
                    type: 'string',
                },
            ],
        });
        const created = await context.repository(type).execute('create', { name: 'Ada' });
        expect(created).toEqual({ _id: expect.any(String), name: 'Ada' });
        expect(dataStorage.create).toHaveBeenCalledWith('person', created);
        expect(dataStorage.get).not.toHaveBeenCalled();
        expect(dataStorage.getEntityType).not.toHaveBeenCalled();
    });

    it('should resolve and execute the requested action without an actor', async () => {
        const dataStorage = storage({
            'entity-type': [
                entityType('person', {
                    properties: [{ _id: 'person:name', name: 'name', type: 'string' }],
                    actions: [
                        {
                            id: 'person:create',
                            name: 'create',
                            label: 'Create person',
                            enabled: true,
                            before: [],
                        },
                    ],
                }),
            ],
        });
        const context = new RuntimeContext(dataStorage);
        const created = await context
            .repository(await getEntityType(dataStorage, 'person'))
            .execute('create', { name: 'Ada' });

        expect(created).toMatchObject({
            name: 'Ada',
        });
        expect(await dataStorage.get('person', (created as Entity)._id)).toEqual(created);
    });
});
