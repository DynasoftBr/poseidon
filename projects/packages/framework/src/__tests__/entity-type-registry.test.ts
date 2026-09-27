import {
    Action,
    Entity,
    EntityTypeDef,
    EntityTypeRegistry,
    Query,
    type EntityTypeDefinition,
} from '../index';
import { definitionOf } from '../model/decorators';

@EntityTypeDef()
class Customer extends Entity {
    @Action({ description: 'Onboards a customer.', permissions: [] })
    static onboard(): Promise<unknown> {
        return Promise.resolve(undefined);
    }

    @Query({ description: 'Lists customers.', permissions: [] })
    static list(): Promise<unknown> {
        return Promise.resolve(undefined);
    }
}

describe('EntityTypeRegistry', () => {
    it('should resolve action and query references from a registered definition', () => {
        const definition: EntityTypeDefinition = {
            ...definitionOf(Customer),
            _id: 'customer-id',
            actions: definitionOf(Customer).actions?.map((action) => ({
                ...action,
                id: `${action.name}-id`,
            })),
            queries: definitionOf(Customer).queries?.map((query) => ({
                ...query,
                id: `${query.name}-id`,
            })),
        };
        const registry = new EntityTypeRegistry();

        registry.register(Customer, definition);

        expect(registry.operationOf(Customer, 'onboard')).toEqual({
            entityTypeId: 'customer-id',
            operationId: 'onboard-id',
        });
        expect(registry.operationOf(Customer, 'list')).toEqual({
            entityTypeId: 'customer-id',
            operationId: 'list-id',
        });
    });

    it('should register a definition without actions or queries', () => {
        const registry = new EntityTypeRegistry();
        const definition = {
            _id: 'address-id',
            name: 'address',
            label: 'Address',
        } as EntityTypeDefinition;

        registry.register(Customer, definition);

        expect(registry.operationOf(Customer, 'onboard')).toBeUndefined();
    });

    it('should return undefined for an operation that is not registered', () => {
        const registry = new EntityTypeRegistry();

        expect(registry.operationOf(Customer, 'onboard')).toBeUndefined();
    });
});
