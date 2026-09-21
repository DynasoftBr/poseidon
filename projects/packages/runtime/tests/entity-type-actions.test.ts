import { createCoreEntityTypes } from '../src/system/core-entity-types';
import type { EntityType } from '@poseidon/models';
import { RuntimeContext } from '../src/runtime-context';
import { storage } from './context-test-storage';

describe('entity type actions', () => {
    it.each([true, false])(
        'should add mandatory properties only through the before action: %s',
        async (enabled) => {
            const definition = createCoreEntityTypes().find((type) => type.name === 'entity-type')!;
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
        const definition = createCoreEntityTypes().find((type) => type.name === 'entity-type')!;
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
        const entityTypes = createCoreEntityTypes();
        const data = storage({ 'entity-type': entityTypes });
        const repository = new RuntimeContext(data).repository<EntityType>(
            entityTypes.find((type) => type.name === 'entity-type')!,
        );

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
