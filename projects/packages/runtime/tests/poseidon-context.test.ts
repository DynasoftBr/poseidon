import type { Entity } from '@poseidon/models';
import { RuntimeContext } from '../src/runtime-context';

import { entity, entityType, getEntityType, storage } from './context-test-storage';

describe('PoseidonContext', () => {
    it('should read only a live entity of the requested type', async () => {
        const person = entity('ada', 'person', { name: 'Ada' });
        const deleted = entity('gone', 'person', { _deletedAt: '2026-09-16T01:00:00.000Z' });
        const context = new RuntimeContext(storage([person, deleted]), entity('alice', 'user'));

        await expect(context.repository(entityType('person')).get('ada')).resolves.toEqual(person);
        await expect(context.repository(entityType('order')).get('ada')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
        await expect(context.repository(entityType('person')).get('gone')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
    });

    it('should create using the supplied entity type without fetching it again', async () => {
        const dataStorage = storage([]);
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'));
        const type = entityType('person', {
            _id: 'person-type-id',
            properties: [
                {
                    _id: 'person:name',
                    entityTypeId: 'person-type-id',
                    name: 'name',
                    type: 'string',
                },
            ],
        });
        const created = await context.repository(type).execute('create', { name: 'Ada' });
        expect(created).toMatchObject({ _entityTypeId: 'person-type-id', name: 'Ada' });
        expect(dataStorage.get).not.toHaveBeenCalled();
        expect(dataStorage.query).not.toHaveBeenCalled();
    });

    it('should query the requested entity type', async () => {
        const dataStorage = storage([]);
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'));
        const action = {
            entityTypeId: 'person',
            filter: {
                kind: 'comparison' as const,
                propertyId: 'person:name',
                operator: 'equals' as const,
                value: 'Ada',
            },
        };

        await context.repository(entityType('person')).query(action);
        expect(dataStorage.query).toHaveBeenCalledWith('person', action);
    });

    it('should resolve and execute the requested action with the bound actor', async () => {
        const dataStorage = storage([
            entityType('person', {
                properties: [
                    { _id: 'person:name', entityTypeId: 'person', name: 'name', type: 'string' },
                ],
                actions: [
                    {
                        id: 'person:create',
                        name: 'create',
                        label: 'Create person',
                        operation: 'create',
                        enabled: true,
                        before: [],
                        after: [],
                    },
                ],
            }),
        ]);
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'));
        const created = await context
            .repository(await getEntityType(dataStorage, 'person'))
            .execute('create', { name: 'Ada' });

        expect(created).toMatchObject({
            _entityTypeId: 'person',
            _createdBy: 'alice',
            name: 'Ada',
        });
        expect(await dataStorage.get('person', (created as Entity)._id)).toEqual(created);
        expect(context.user._id).toBe('alice');
    });
});
