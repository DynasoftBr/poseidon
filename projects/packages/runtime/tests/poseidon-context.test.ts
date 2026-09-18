import type { Entity } from '@poseidon/models';
import { RuntimeContext } from '../src/runtime-context';

import { entity, storage } from './context-test-storage';

describe('PoseidonContext', () => {
    it('should reject direct persistence of a structure through a repository', async () => {
        const dataStorage = storage([
            entity('address', 'entity-type', { name: 'address', structure: true, properties: [] }),
        ]);
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'));
        await expect(
            context.repository('address').create({ city: 'London' }),
        ).rejects.toMatchObject({ code: 'validation' });
        expect(await dataStorage.get('address', 'home')).toBeNull();
    });
    it('should read only a live entity of the requested type', async () => {
        const person = entity('ada', 'person', { name: 'Ada' });
        const deleted = entity('gone', 'person', { _deletedAt: '2026-09-16T01:00:00.000Z' });
        const context = new RuntimeContext(storage([person, deleted]), entity('alice', 'user'));

        await expect(context.repository('person').get('ada')).resolves.toEqual(person);
        await expect(context.repository('order').get('ada')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
        await expect(context.repository('person').get('gone')).rejects.toMatchObject({
            code: 'entity-not-found',
        });
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

        await context.repository('person').query(action);
        expect(dataStorage.query).toHaveBeenCalledWith('person', action);
        expect(dataStorage.query).toHaveBeenCalledOnce();
    });

    it('should resolve and execute the requested action with the bound actor', async () => {
        const dataStorage = storage([
            entity('person', 'entity-type', {
                properties: [],
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
        const created = await context.repository('person').execute('create', { name: 'Ada' });

        expect(created).toMatchObject({
            _entityTypeId: 'person',
            _createdBy: 'alice',
            name: 'Ada',
        });
        expect(await dataStorage.get('person', (created as Entity)._id)).toEqual(created);
        expect(context.user._id).toBe('alice');
    });
});
