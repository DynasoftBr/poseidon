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
    poseidon.initialize({ context: new PoseidonContext(transport, () => undefined) });
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
            { entityType: 'customer', action: 'get', payload: { _id: 'customer-1' } },
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

        await EntityType.save({
            _id: 'customer',
            _version: 2,
            name: 'customer',
            label: 'Customer',
            properties: [],
        });

        expect(transport.requests[0]).toMatchObject({ entityType: 'entity-type', action: 'save' });
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
    @Action({ description: 'Onboards a customer.' })
    onboard(_payload: object): Promise<unknown> {
        return Promise.resolve('handler');
    }
}

it('should dispatch instance actions through the active context', async () => {
    const transport = new TestTransport();
    initialize(transport);

    await new InstanceCustomer().onboard({ name: 'Ada' });

    expect(transport.requests).toEqual([
        {
            entityType: 'instance-customer',
            action: 'onboard',
            payload: { name: 'Ada' },
        },
    ]);
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
