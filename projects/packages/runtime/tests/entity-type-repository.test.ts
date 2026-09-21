import { createBootstrapModel } from '../src/bootstrap-model';
import { EntityTypeRepository } from '../src/entity-type-repository';
import { RuntimeContext } from '../src/runtime-context';
import { entityType, storage } from './context-test-storage';

describe('EntityTypeRepository', () => {
    it('should find entity types by name even when their IDs differ', async () => {
        const model = createBootstrapModel('system', new Date());
        const data = storage([]);
        const customer = entityType('customer', { _id: 'customer-type-id' });
        data.query.mockResolvedValueOnce([customer]).mockResolvedValueOnce([]);
        const repository = new EntityTypeRepository(
            model.entityTypes.find((type) => type.name === 'entity-type')!,
            new RuntimeContext(data, model.users[0]),
        );
        expect(await repository.findByName('customer')).toEqual(customer);
        expect(data.query).toHaveBeenCalledWith('entity-type', {
            entityTypeId: 'entity-type',
            filter: {
                kind: 'comparison',
                propertyId: 'entity-type:name',
                operator: 'equals',
                value: 'customer',
            },
            limit: 1,
        });
        expect(await repository.findByName('missing')).toBeNull();
    });

    it('should create and retrieve entity types without an entity type name', async () => {
        const model = createBootstrapModel('system', new Date());
        const data = storage([...model.users, ...model.entityTypes, ...model.scripts]);
        const repository = new EntityTypeRepository(
            model.entityTypes.find((type) => type.name === 'entity-type')!,
            new RuntimeContext(data, model.users[0]),
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
