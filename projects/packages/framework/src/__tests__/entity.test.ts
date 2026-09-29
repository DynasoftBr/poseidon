import { invocationToken } from './development-token';
import {
    Action,
    Entity,
    EntityType,
    EntityTypeDef,
    PoseidonContext,
    Property,
    poseidon,
    operationMethodOf,
    type PoseidonRequest,
    type PoseidonTransport,
} from '../index';

@EntityTypeDef({ name: 'customer' })
class Customer extends Entity {
    @Property({ type: 'string' })
    name!: string;
}

class TestTransport implements PoseidonTransport {
    public readonly requests: PoseidonRequest[] = [];

    send<TResult>(request: PoseidonRequest, _token: string | undefined): Promise<TResult> {
        this.requests.push(request);
        return Promise.resolve('done' as TResult);
    }
}

function initialize(transport: TestTransport): void {
    poseidon.initialize({
        context: new PoseidonContext(transport, () =>
            invocationToken([
                'query:customer:get',
                'action:customer:save',
                'action:customer:validate',
                'action:customer:delete',
                'action:entity-type:applyDefinitions',
                'action:entity-type:save',
                'action:instance-customer:onboard',
                'action:lifecycle-customer:applyDefaults',
                'action:lifecycle-customer:applyConventions',
            ]),
        ),
    });
}

describe('entity actions', () => {
    it('should dispatch static entity operations through the active context', async () => {
        const transport = new TestTransport();
        initialize(transport);

        await Customer.get({ _id: 'customer-1' });
        await Customer.save({ _id: 'customer-1', _version: 2, name: 'Ada' });
        await Customer.validate({ _id: 'customer-1', _version: 2, name: 'Ada' });
        await Customer.delete({ _id: 'customer-1', _version: 2 });

        expect(transport.requests).toEqual([
            {
                entityType: 'customer',
                action: 'get',
                payload: { _id: 'customer-1' },
            },
            {
                entityType: 'customer',
                action: 'save',
                payload: { _id: 'customer-1', _version: 2, name: 'Ada' },
            },
            {
                entityType: 'customer',
                action: 'validate',
                payload: { _id: 'customer-1', _version: 2, name: 'Ada' },
            },
            {
                entityType: 'customer',
                action: 'delete',
                payload: { _id: 'customer-1', _version: 2 },
            },
        ]);
    });

    it('should use entity-type for EntityType operations', async () => {
        const transport = new TestTransport();
        initialize(transport);

        await EntityType.applyDefinitions({ definitions: [] });
        await Reflect.apply(operationMethodOf(EntityType, 'applyDefinitions')!, EntityType, [
            { definitions: [] },
        ]);
        await EntityType.save({
            _id: 'customer',
            _version: 2,
            name: 'customer',
            label: 'Customer',
            properties: [],
        });
        await Reflect.apply(operationMethodOf(EntityType, 'save')!, EntityType, [
            { _id: 'customer', _version: 2, name: 'customer', label: 'Customer', properties: [] },
        ]);

        expect(transport.requests.map((request) => request.action)).toEqual([
            'applyDefinitions',
            'applyDefinitions',
            'save',
            'save',
        ]);
        expect(transport.requests.every((request) => request.entityType === 'entity-type')).toBe(
            true,
        );
    });

    it('should retain original handlers for runtime dispatch', async () => {
        const transport = new TestTransport();
        initialize(transport);

        await Reflect.apply(operationMethodOf(Entity, 'get')!, Customer, [{ _id: 'customer-1' }]);
        await Reflect.apply(operationMethodOf(Entity, 'save')!, Customer, [{ name: 'Ada' }]);
        await Reflect.apply(operationMethodOf(Entity, 'applyDefaults')!, Customer, [{}]);
        await Reflect.apply(operationMethodOf(Entity, 'applyConventions')!, Customer, [{}]);
        await Reflect.apply(operationMethodOf(Entity, 'validate')!, Customer, [{}]);
        await Reflect.apply(operationMethodOf(Entity, 'delete')!, Customer, [
            { _id: 'customer-1', _version: 2 },
        ]);

        expect(transport.requests.map((request) => request.action)).toEqual([
            'get',
            'save',
            'applyDefaults',
            'applyConventions',
            'validate',
            'delete',
        ]);
    });
});

@EntityTypeDef({ name: 'instance-customer' })
class InstanceCustomer {
    @Action({ description: 'Onboards a customer.', permissions: () => [] })
    static onboard(_payload: object): Promise<unknown> {
        return Promise.resolve('handler');
    }
}

it('should dispatch static actions through the active context', async () => {
    const transport = new TestTransport();
    initialize(transport);

    await expect(InstanceCustomer.onboard({ name: 'Ada' })).resolves.toBe('handler');

    expect(transport.requests).toEqual([]);
});

@EntityTypeDef({ name: 'lifecycle-customer' })
class LifecycleCustomer extends Entity {
    static defaults(payload: object): Promise<unknown> {
        return this.applyDefaults(payload);
    }

    static conventions(payload: object): Promise<unknown> {
        return this.applyConventions(payload);
    }
}

it('should dispatch static lifecycle operations through the active context', async () => {
    const transport = new TestTransport();
    initialize(transport);

    await LifecycleCustomer.defaults({ _id: 'customer-1' });
    await LifecycleCustomer.conventions({ _id: 'customer-1' });

    expect(transport.requests).toEqual([
        {
            entityType: 'lifecycle-customer',
            action: 'applyDefaults',
            payload: { _id: 'customer-1' },
        },
        {
            entityType: 'lifecycle-customer',
            action: 'applyConventions',
            payload: { _id: 'customer-1' },
        },
    ]);
});
