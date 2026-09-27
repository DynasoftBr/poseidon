import {
    Action,
    Entity,
    ModelBuilder,
    EntityTypeDef,
    PoseidonContext,
    Property,
    poseidon,
    type PoseidonRequest,
    type PoseidonTransport,
} from '../index';

@EntityTypeDef({ label: 'Customer', description: 'Represents a customer.' })
class Customer extends Entity {
    @Property({ type: 'string', required: true, description: 'Customer name.' })
    name!: string;

    @Action({ description: 'Onboards a customer.', permissions: [] })
    static onboard(): Promise<unknown> {
        return Promise.resolve(undefined);
    }
}

class RecordingTransport implements PoseidonTransport {
    public request?: PoseidonRequest;

    public send<TResult>(request: PoseidonRequest, _token: string | undefined): Promise<TResult> {
        this.request = request;
        return Promise.resolve(undefined as TResult);
    }
}

it('should apply an external service model after initialization', async () => {
    const transport = new RecordingTransport();
    poseidon.initialize({ context: new PoseidonContext(transport, () => undefined) });

    const model = new ModelBuilder();
    model.entity(Customer);
    await model.apply();

    expect(transport.request).toMatchObject({
        entityType: 'entity-type',
        action: 'applyDefinitions',
    });
    const definitions = (transport.request?.payload as { definitions: object[] }).definitions;
    expect(definitions).toHaveLength(1);
    expect(definitions[0]).toMatchObject({
        _id: 'customer',
        name: 'customer',
        label: 'Customer',
        description: 'Represents a customer.',
    });
    const definition = definitions[0] as { actions: object[]; properties: object[] };
    expect(definition.properties).toEqual(
        expect.arrayContaining([
            {
                name: '_id',
                type: 'string',
                required: true,
                description: 'Identifier of the entity.',
            },
            {
                name: '_version',
                type: 'integer',
                description: 'Version of the persisted entity.',
            },
            { name: 'name', type: 'string', required: true, description: 'Customer name.' },
        ]),
    );
    expect(definition.actions).toContainEqual(
        expect.objectContaining({
            id: 'onboard',
            name: 'onboard',
            description: 'Onboards a customer.',
            permissions: [],
        }),
    );
});
