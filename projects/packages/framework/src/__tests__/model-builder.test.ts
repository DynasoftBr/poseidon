import {
    PoseidonAction,
    Action,
    Entity,
    ModelBuilder,
    EntityProperty,
    EntityTypeDef,
    EntityTypeFactory,
    Identity,
    Property,
    Query,
    Structure,
    User,
    poseidon,
    PoseidonContext,
    type PoseidonRequest,
    type PropertyOptions,
} from '../index';
import { definitionOf, entityTypeNameOf, operationMethodOf } from '../model/decorators';
import { EntityType as CoreEntityType } from '../entity-types/entity-type';

const testContext = new PoseidonContext(
    {
        send<TResult>() {
            return Promise.resolve(undefined as TResult);
        },
    },
    () => undefined,
);
poseidon.initialize({ context: testContext });

describe('decorated model declarations', () => {
    it('should declare actions without runtime steps', () => {
        @EntityTypeDef()
        class Customer extends Entity {
            @Action({ description: 'Performs this action.', permissions: [] })
            static list(): Promise<unknown> {
                return Promise.resolve(undefined);
            }
        }

        expect(definitionOf(Customer).actions).toEqual([
            {
                id: 'save',
                name: 'save',
                label: 'save',
                description: 'Creates or updates an entity.',
                permissions: [],
                enabled: true,
            },
            {
                id: 'applyDefaults',
                name: 'applyDefaults',
                label: 'applyDefaults',
                description: 'Applies declared property defaults.',
                permissions: [],
                enabled: true,
            },
            {
                id: 'applyConventions',
                name: 'applyConventions',
                label: 'applyConventions',
                description: 'Applies declared property conventions.',
                permissions: [],
                enabled: true,
            },
            {
                id: 'validate',
                name: 'validate',
                label: 'validate',
                description: 'Validates entity data against declared properties.',
                permissions: [],
                enabled: true,
            },
            {
                id: 'delete',
                name: 'delete',
                label: 'delete',
                description: 'Deletes an entity.',
                permissions: [],
                enabled: true,
            },
            {
                id: 'list',
                name: 'list',
                label: 'list',
                description: 'Performs this action.',
                permissions: [],
                enabled: true,
            },
        ]);
    });

    it('should persist declared action and query permissions', () => {
        @EntityTypeDef()
        class Customer {
            @Action({ description: 'Updates a customer.', permissions: ['customer:write'] })
            static update(): Promise<void> {
                return Promise.resolve();
            }

            @Query({ description: 'Reads a customer.', permissions: ['customer:read'] })
            static get(): Promise<void> {
                return Promise.resolve();
            }
        }

        expect(definitionOf(Customer)).toMatchObject({
            actions: [expect.objectContaining({ name: 'update', permissions: ['customer:write'] })],
            queries: [expect.objectContaining({ name: 'get', permissions: ['customer:read'] })],
        });
    });

    it('should reject symbol-named action methods', () => {
        class Customer {}
        expect(() =>
            Action({ description: 'Performs this action.', permissions: [] })(
                Customer.prototype,
                Symbol('run'),
                {
                    value: () => Promise.resolve(undefined),
                },
            ),
        ).toThrow('string names');
    });

    it('should reject actions that do not decorate methods', () => {
        class Customer {}
        expect(() =>
            Action({ description: 'Performs this action.', permissions: [] })(
                Customer.prototype,
                'run',
                {},
            ),
        ).toThrow('decorate methods');
    });

    it('should declare PoseidonAction as a structure', () => {
        expect(new Structure()).toBeInstanceOf(Structure);
        const action = new PoseidonAction();
        action.id = 'create';
        expect(action).not.toBeInstanceOf(Entity);
        expect(action).toBeInstanceOf(Structure);
        expect(action.id).toBe('create');
    });

    it('should inherit the entity identifier for EntityType records', () => {
        const entityType = new CoreEntityType();
        entityType._id = 'customer';
        expect(entityType._id).toBe('customer');
        expect(entityType).toBeInstanceOf(Entity);
    });

    it('should expose user and identity data shapes', () => {
        const identity = new Identity();
        identity.kind = 'user';
        identity.members = ['support'];
        const user = new User();
        user.identityId = 'user-identity';

        expect(identity).toMatchObject({ kind: 'user', members: ['support'] });
        expect(user.identityId).toBe('user-identity');
    });

    it('should invoke known and dynamic entity-type actions', async () => {
        const requests: PoseidonRequest[] = [];
        const context = new PoseidonContext(
            {
                send<TResult>(request: PoseidonRequest): Promise<TResult> {
                    requests.push(request);
                    return Promise.resolve(undefined as TResult);
                },
            },
            () => undefined,
        );
        const factory = new EntityTypeFactory();
        const customer = factory.create('customer');

        await poseidon.run(context, async () => {
            await Identity.authenticate({ identityId: 'ada-identity', secret: 'secret' });
            await User.save({ _id: 'ada' });
            await Reflect.apply(operationMethodOf(Identity, 'authenticate')!, Identity, [
                { identityId: 'ada-identity', secret: 'secret' },
            ]);
            await Reflect.apply(operationMethodOf(User, 'save')!, User, [{ _id: 'ada' }]);
            await Reflect.apply(Reflect.get(customer, 'save'), customer, [{ name: 'Ada' }]);
        });

        expect(Reflect.get(customer, 'onboard')).toBeUndefined();
        expect(requests).toEqual([
            {
                entityType: 'identity',
                action: 'authenticate',
                payload: { identityId: 'ada-identity', secret: 'secret' },
            },
            { entityType: 'user', action: 'save', payload: { _id: 'ada' } },
            {
                entityType: 'identity',
                action: 'authenticate',
                payload: { identityId: 'ada-identity', secret: 'secret' },
            },
            { entityType: 'user', action: 'save', payload: { _id: 'ada' } },
            { entityType: 'customer', action: 'save', payload: { name: 'Ada' } },
        ]);
    });

    it('should restrict item declarations to supported types and classes', () => {
        expectTypeOf<string>().not.toExtend<NonNullable<PropertyOptions['itemsType']>>();
        expectTypeOf<'string'>().toExtend<NonNullable<PropertyOptions['itemsType']>>();
        expectTypeOf<typeof EntityProperty>().toExtend<NonNullable<PropertyOptions['itemsType']>>();
    });

    it('should declare EntityProperty as an embedded type with property constraints', () => {
        const property = new EntityProperty();
        property.name = 'email';
        property.type = 'string';
        expect(property.name).toBe('email');
        expect(property.type).toBe('string');
    });

    it('should serialize class item types as exact entity-type IDs', () => {
        @EntityTypeDef({ name: 'postal-address', structure: true })
        class Address {
            @Property({ type: 'string', required: true })
            city!: string;
        }
        @EntityTypeDef()
        class Customer {
            @Property({ type: 'array', itemsType: Address })
            addresses!: Address[];
        }
        const definition = JSON.parse(JSON.stringify(definitionOf(Customer)));
        expect(definition.properties).toEqual([
            { name: 'addresses', type: 'array', itemsType: 'postal-address' },
        ]);
    });

    it('should collect property constraints without constructing the entity', () => {
        @EntityTypeDef({ label: 'Customer', description: 'A person buying our products.' })
        class Customer {
            @Property({
                type: 'string',
                required: true,
                minLength: 1,
                description: 'Customer display name.',
            })
            name!: string;

            @Property({ type: 'integer', minimum: 0, maximum: 120 })
            age!: number;

            @Property({ type: 'array', itemsType: 'string', default: [], uniqueItems: true })
            tags!: string[];

            constructor() {
                throw new Error('The builder must not construct entities.');
            }
        }

        const model = new ModelBuilder();
        expect(model.entity(Customer)).toBe(model);
        expect(definitionOf(Customer)).toEqual({
            _id: 'customer',
            name: 'customer',
            label: 'Customer',
            description: 'A person buying our products.',
            properties: [
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                    minLength: 1,
                    description: 'Customer display name.',
                },
                { name: 'age', type: 'integer', minimum: 0, maximum: 120 },
                {
                    name: 'tags',
                    type: 'array',
                    itemsType: 'string',
                    default: [],
                    uniqueItems: true,
                },
            ],
        });
    });

    it('should support named embedded definitions', () => {
        @EntityTypeDef({ name: 'postal-address', label: 'Postal address', structure: true })
        class Address {
            @Property({ type: 'string' })
            city!: string;
        }

        expect(definitionOf(Address)).toEqual({
            _id: 'postal-address',
            name: 'postal-address',
            label: 'Postal address',
            structure: true,
            properties: [{ name: 'city', type: 'string' }],
        });
    });

    it('should infer kebab-case names and preserve the class label', () => {
        @EntityTypeDef()
        class APIClient {}

        expect(definitionOf(APIClient)).toEqual({
            _id: 'api-client',
            name: 'api-client',
            label: 'APIClient',
            properties: [],
        });
    });

    it('should keep model declarations independent', () => {
        @EntityTypeDef({ name: 'customer' })
        class Customer {}

        @EntityTypeDef({ name: 'customer' })
        class OtherCustomer {}

        const model = new ModelBuilder();
        expect(model.entity(Customer).entity(Customer)).toBe(model);
        expect(() => model.entity(OtherCustomer)).toThrow('already declared by another class');
        expect(() => new ModelBuilder().entity(OtherCustomer)).not.toThrow();
    });

    it('should reject classes without entity metadata', () => {
        class Customer {}
        expect(() => new ModelBuilder().entity(Customer)).toThrow('must declare @EntityTypeDef()');
    });

    it('should include inherited properties without changing the base definition', () => {
        @EntityTypeDef()
        class Contact {
            @Property({ type: 'string' })
            name!: string;
        }

        @EntityTypeDef()
        class Customer extends Contact {
            @Property({ type: 'string', required: true })
            override name = '';
        }

        expect(definitionOf(Customer).properties).toEqual([
            { name: 'name', type: 'string', required: true },
        ]);
        expect(definitionOf(Contact).properties).toEqual([{ name: 'name', type: 'string' }]);
    });

    it('should reject static and symbol properties', () => {
        class Customer {}
        const property = Property({ type: 'string' });
        expect(() => property(Customer, 'name')).toThrow('named instance properties');
        expect(() => property(Customer.prototype, Symbol('name'))).toThrow(
            'named instance properties',
        );
    });
});

describe('decorator error paths', () => {
    it('should reject invalid queries and resolve decorated operations', () => {
        class Customer {
            @Action({ description: 'Performs this action.', permissions: [] })
            async create(): Promise<void> {}

            @Query({ description: 'Reads data.', permissions: [] })
            async list(): Promise<void> {}
        }
        expect(operationMethodOf(Customer, 'create')).not.toBe(Customer.prototype.create);
        expect(operationMethodOf(Customer, 'list')).not.toBe(Customer.prototype.list);
        expect(() =>
            Query({ description: 'Reads data.', permissions: [] })(
                Customer.prototype,
                Symbol('list'),
                {
                    value: () => Promise.resolve(undefined),
                },
            ),
        ).toThrow('string names');
        expect(() =>
            Query({ description: 'Reads data.', permissions: [] })(Customer.prototype, 'list', {}),
        ).toThrow('decorate methods');
    });

    it('should resolve an explicit static entity type name', () => {
        class Customer {
            static entityTypeName = 'customer';
        }
        expect(entityTypeNameOf(Customer)).toBe('customer');
    });
});

it('should record static queries', () => {
    class Customer {
        @Query({ description: 'Reads data.', permissions: [] })
        static list(): Promise<void> {
            return Promise.resolve();
        }
    }
    expect(operationMethodOf(Customer, 'list')).not.toBe(Customer.list);
});
