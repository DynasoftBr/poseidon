import {
    EntityTypeDef,
    ModelBuilder,
    PoseidonContext,
    Property,
    poseidon,
    type PoseidonRequest,
    type PoseidonTransport,
} from '../index';

@EntityTypeDef()
class Customer {
    @Property({ type: 'string', required: true })
    name!: string;
}

class TestTransport implements PoseidonTransport {
    public request?: PoseidonRequest;

    send<TResult>(request: PoseidonRequest, _token: string | undefined): Promise<TResult> {
        this.request = request;
        return Promise.resolve(undefined as TResult);
    }
}

describe('applying a decorated model', () => {
    it('should send all definitions through applyDefinitions', async () => {
        const transport = new TestTransport();
        poseidon.initialize({ context: new PoseidonContext(transport, () => undefined) });

        await new ModelBuilder().entity(Customer).apply();

        expect(transport.request).toEqual({
            entityType: 'entity-type',
            action: 'applyDefinitions',
            payload: {
                definitions: [
                    {
                        _id: 'customer',
                        name: 'customer',
                        label: 'Customer',
                        properties: [
                            { _id: 'customer:name', name: 'name', type: 'string', required: true },
                        ],
                    },
                ],
            },
        });
    });

    it('should perform no request for an empty model', async () => {
        await new ModelBuilder().apply();
    });
});
