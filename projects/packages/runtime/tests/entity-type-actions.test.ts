import type { EntityType } from '@poseidon/models';
import { RuntimeContext } from '../src/runtime-context';
import { entityTypeDefinition, storage } from './context-test-storage';

describe('entity type actions', () => {
    it.each([true, false])(
        'should add mandatory properties only through the before action: %s',
        async (enabled) => {
            const definition = entityTypeDefinition();
            if (!enabled) definition.actions = [];
            const repository = new RuntimeContext(storage()).repository<EntityType>(definition);
            await repository.execute('create', {
                _id: 'customer',
                name: 'customer',
                label: 'Customer',
                properties: [],
            });
            const created = await repository.get('customer');
            expect(created.properties).toEqual(
                enabled
                    ? [{ _id: 'customer:_id', name: '_id', type: 'string', required: true }]
                    : [],
            );
        },
    );

    it('should keep structure properties unchanged on creation and update', async () => {
        const definition = entityTypeDefinition();
        const repository = new RuntimeContext(storage()).repository<EntityType>(definition);
        await repository.execute('create', {
            _id: 'address',
            name: 'address',
            label: 'Address',
            structure: true,
            properties: [],
        });
        await repository.execute('update', { _id: 'address', properties: [] });
        expect((await repository.get('address')).properties).toEqual([]);
    });

    it('should create and retrieve entity types without an entity type name', async () => {
        const definition = entityTypeDefinition();
        const data = storage({ 'entity-type': [definition] });
        const repository = new RuntimeContext(data).repository<EntityType>(definition);

        await repository.execute('create', {
            _id: 'customer',
            name: 'customer',
            label: 'Customer',
            properties: [],
        });

        const entityType = await repository.get('customer');
        expect(entityType.name).toBe('customer');
        expect(entityType.label).toBe('Customer');
        expect(await data.get('entity-type', 'customer')).toEqual(entityType);
    });
});
