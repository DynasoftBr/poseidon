import { createPrivateKey, sign } from 'node:crypto';
import { EntityType as FrameworkEntityType } from '../entity-types/entity-type';
import { User as FrameworkUser } from '../entity-types/user';
import {
    Action,
    Entity,
    EntityType,
    Identity,
    User,
    EntityTypeDef,
    PoseidonContext,
    Query,
    definitionOf,
    parseOperationAddress,
    poseidon,
    verifyDevelopmentToken,
    type PoseidonRequest,
    type PoseidonTransport,
    type ActionMethod,
    OperationReference,
} from '../index';

const signingKey = createPrivateKey(`-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIFgoBNccNzGrtuOiyeUjyO881Hh2o7vPa6kuEzgiHzWF
-----END PRIVATE KEY-----`);

class RecordingTransport implements PoseidonTransport {
    public readonly requests: PoseidonRequest[] = [];
    public authorizationError?: Error;

    public send<TResult>(request: PoseidonRequest): Promise<TResult> {
        this.requests.push(request);
        if (request.entityType === 'identity' && request.action === 'authorize') {
            if (this.authorizationError) return Promise.reject(this.authorizationError);
            const operation = (request.payload as { operation: string }).operation;
            return Promise.resolve({
                token: token(invocationPermissions(operation), { kind: 'invocation' }),
            } as TResult);
        }
        return Promise.resolve(request.payload as TResult);
    }
}

function invocationPermissions(operation: string): string[] {
    if (operation === 'action:customer:onboard') return ['action:customer:save'];
    if (operation === 'action:delegating-customer:onboard') {
        return ['action:delegating-customer:save', 'query:delegating-customer:get'];
    }
    return [];
}

@EntityTypeDef()
class Customer extends Entity {
    @Action({ description: 'Onboards a customer.', permissions: () => [Customer.save] })
    static onboard(payload: object): Promise<unknown> {
        return Customer.save(payload);
    }

    @Query({ description: 'Lists customers.', permissions: () => [] })
    static list(payload: object): Promise<unknown> {
        return Promise.resolve(payload);
    }
}

@EntityTypeDef()
class DelegatingCustomer extends Entity {
    @Action({
        description: 'Onboards a customer through a nested save.',
        permissions: () => [DelegatingCustomer.save],
    })
    static onboard(payload: object): Promise<unknown> {
        return DelegatingCustomer.save(payload);
    }

    @Action({
        description: 'Saves a customer after reading it.',
        permissions: () => [DelegatingCustomer.get],
    })
    static override save<TResult = unknown>(payload: object): Promise<TResult> {
        return DelegatingCustomer.get(payload as { _id: string }) as Promise<TResult>;
    }
}

@EntityTypeDef()
class InvalidPermissionCustomer {
    @Action({
        description: 'Uses an invalid delegated permission.',
        permissions: () => [(() => Promise.resolve()) as unknown as ActionMethod],
    })
    static execute(payload: object): Promise<unknown> {
        return Promise.resolve(payload);
    }
}

type TokenOptions = {
    exp?: number;
    header?: object;
    payload?: object;
    kind?: 'user' | 'invocation';
};

function token(permissions: string[], options: TokenOptions = {}): string {
    const exp = options.exp ?? Math.floor(Date.now() / 1000) + 900;
    const kind = options.kind ?? 'user';
    const header = Buffer.from(
        JSON.stringify(options.header ?? { alg: 'EdDSA', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
        JSON.stringify(
            options.payload ??
                (kind === 'user'
                    ? { kind, sub: 'ada', permissions, exp }
                    : { kind, sub: 'ada', origin: 'action:customer:onboard', permissions, exp }),
        ),
    ).toString('base64url');
    const signature = sign(null, Buffer.from(`${header}.${payload}`), signingKey).toString(
        'base64url',
    );
    return `${header}.${payload}.${signature}`;
}

function initialize(transport: RecordingTransport, value: string | undefined): void {
    poseidon.initialize({ context: new PoseidonContext(transport, () => value) });
}

describe('operation authorization', () => {
    it('should execute an action body and delegate its declared operation', async () => {
        const transport = new RecordingTransport();
        initialize(transport, token(['action:customer:onboard']));

        await expect(Customer.onboard({ name: 'Ada' })).resolves.toEqual({ name: 'Ada' });
        expect(transport.requests).toEqual([
            {
                entityType: 'identity',
                action: 'authorize',
                payload: { operation: 'action:customer:onboard' },
            },
            {
                entityType: 'customer',
                action: 'save',
                payload: { name: 'Ada' },
            },
        ]);
        expect(definitionOf(Customer).actions?.[5]).toMatchObject({
            _id: 'action:customer:onboard',
            permissions: [{ entityTypeId: 'customer', operationId: 'action:customer:save' }],
        });
        expect(definitionOf(Customer).queries?.[1]).toMatchObject({
            _id: 'query:customer:list',
        });
    });

    it('should transitively delegate nested operations', async () => {
        const transport = new RecordingTransport();
        initialize(transport, token(['action:delegating-customer:onboard']));

        await expect(DelegatingCustomer.onboard({ _id: 'ada' })).resolves.toEqual({ _id: 'ada' });
        expect(transport.requests).toEqual([
            {
                entityType: 'identity',
                action: 'authorize',
                payload: { operation: 'action:delegating-customer:onboard' },
            },
            {
                entityType: 'delegating-customer',
                action: 'get',
                payload: { _id: 'ada' },
            },
        ]);
    });

    it('should reject missing and insufficient entry tokens', async () => {
        const transport = new RecordingTransport();
        initialize(transport, undefined);
        await expect(Customer.onboard({})).rejects.toThrow('requires authentication');

        transport.authorizationError = new Error(
            "Operation 'action:customer:onboard' is not authorized.",
        );
        initialize(transport, token(['query:customer:list']));
        await expect(Customer.onboard({})).rejects.toThrow('is not authorized');
    });

    it('should reject an invocation token outside its delegated permissions', async () => {
        const transport = new RecordingTransport();
        const context = new PoseidonContext(transport, () => token([], { kind: 'invocation' }));
        await expect(poseidon.run(context, () => Customer.save({}))).rejects.toThrow(
            'Invocation is not authorized',
        );
    });

    it('should reject an undecorated delegated permission', () => {
        const transport = new RecordingTransport();
        initialize(transport, token(['action:invalid-permission-customer:execute']));
        expect(() => definitionOf(InvalidPermissionCustomer)).toThrow('decorated methods');
    });

    it('should construct operation references', () => {
        const reference = new OperationReference();
        reference.entityTypeId = 'customer';
        reference.operationId = 'action:customer:onboard';
        expect(reference).toMatchObject({ entityTypeId: 'customer' });
    });

    it('should execute scoped entity-type and user facades', async () => {
        const transport = new RecordingTransport();
        const context = new PoseidonContext(transport, () =>
            token(
                [
                    'action:entity-type:applyDefinitions',
                    'action:entity-type:save',
                    'action:user:save',
                ],
                { kind: 'invocation' },
            ),
        );

        await poseidon.run(context, async () => {
            await EntityType.applyDefinitions({ definitions: [] });
            await EntityType.save({ _id: 'customer' });
            await User.save({ _id: 'ada' });
        });

        expect(transport.requests.map((request) => request.action)).toEqual([
            'applyDefinitions',
            'save',
            'save',
        ]);
        expect(definitionOf(FrameworkEntityType).actions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'applyDefinitions' }),
                expect.objectContaining({ name: 'save' }),
            ]),
        );
        expect(definitionOf(FrameworkUser).actions).toEqual(
            expect.arrayContaining([expect.objectContaining({ name: 'save' })]),
        );
    });

    it('should allow public authentication without a token', async () => {
        const transport = new RecordingTransport();
        initialize(transport, undefined);
        await expect(
            Identity.authenticate({ identityId: 'ada', secret: 'secret' }),
        ).resolves.toEqual({
            identityId: 'ada',
            secret: 'secret',
        });
        expect(definitionOf(Identity).actions).toBeDefined();
    });
});

describe('development tokens', () => {
    it('should reject invalid, expired, malformed, and tampered tokens', async () => {
        await expect(verifyDevelopmentToken('broken')).rejects.toThrow('invalid');
        await expect(
            verifyDevelopmentToken(token([], { header: { alg: 'none' } })),
        ).rejects.toThrow('invalid');
        await expect(verifyDevelopmentToken(token([], { exp: 0 }))).rejects.toThrow('expired');
        await expect(verifyDevelopmentToken(token([], { payload: {} }))).rejects.toThrow('invalid');
        const valid = token([]);
        await expect(verifyDevelopmentToken(`${valid}.extra`)).rejects.toThrow('invalid');
        const [header, _payload, signature] = valid.split('.');
        const tampered = `${header}.${Buffer.from(
            JSON.stringify({
                kind: 'user',
                sub: 'eve',
                permissions: [],
                exp: Math.floor(Date.now() / 1000) + 900,
            }),
        ).toString('base64url')}.${signature}`;
        await expect(verifyDevelopmentToken(tampered)).rejects.toThrow('invalid');
        await expect(
            verifyDevelopmentToken(token([]).replace(/[^.]+(?=\.)/, 'e30')),
        ).rejects.toThrow('invalid');
    });

    it('should parse operation addresses', () => {
        expect(parseOperationAddress('action:customer:onboard')).toEqual({
            kind: 'action',
            entityType: 'customer',
            operation: 'onboard',
        });
        expect(parseOperationAddress('wrong:customer:onboard')).toBeNull();
        expect(parseOperationAddress('action::onboard')).toBeNull();
        expect(parseOperationAddress('action:customer')).toBeNull();
        expect(parseOperationAddress('action:customer:onboard:extra')).toBeNull();
    });
});
