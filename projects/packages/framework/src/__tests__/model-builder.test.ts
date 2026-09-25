import {
    PoseidonAction,
    Action,
    Entity,
    EntityProperty,
    EntityTypeDef,
    Property,
    Query,
    Structure,
    poseidon,
    PoseidonContext,
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
            @Action({ description: 'Performs this action.' })
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
                enabled: true,
                before: [
                    {
                        id: 'applyDefaults',
                        name: 'applyDefaults',
                        label: 'applyDefaults',
                        description: 'Applies declared property defaults.',
                        enabled: true,
                        before: [],
                    },
                    {
                        id: 'applyConventions',
                        name: 'applyConventions',
                        label: 'applyConventions',
                        description: 'Applies declared property conventions.',
                        enabled: true,
                        before: [],
                    },
                    {
                        id: 'validate',
                        name: 'validate',
                        label: 'validate',
                        description: 'Validates entity data against declared properties.',
                        enabled: true,
                        before: [],
                    },
                ],
            },
            {
                id: 'applyDefaults',
                name: 'applyDefaults',
                label: 'applyDefaults',
                description: 'Applies declared property defaults.',
                enabled: true,
                before: [],
            },
            {
                id: 'applyConventions',
                name: 'applyConventions',
                label: 'applyConventions',
                description: 'Applies declared property conventions.',
                enabled: true,
                before: [],
            },
            {
                id: 'validate',
                name: 'validate',
                label: 'validate',
                description: 'Validates entity data against declared properties.',
                enabled: true,
                before: [],
            },
            {
                id: 'delete',
                name: 'delete',
                label: 'delete',
                description: 'Deletes an entity.',
                enabled: true,
                before: [],
            },
            {
                id: 'list',
                name: 'list',
                label: 'list',
                description: 'Performs this action.',
                enabled: true,
                before: [],
            },
        ]);
    });

    it('should reject symbol-named action methods', () => {
        class Customer {}
        expect(() =>
            Action({ description: 'Performs this action.' })(Customer.prototype, Symbol('run'), {
                value: () => Promise.resolve(undefined),
            }),
        ).toThrow('string names');
    });

    it('should reject actions that do not decorate methods', () => {
        class Customer {}
        expect(() =>
            Action({ description: 'Performs this action.' })(Customer.prototype, 'run', {}),
        ).toThrow('decorate methods');
    });

    it('should resolve decorated before actions', () => {
        @EntityTypeDef()
        class Customer {
            @Action({ description: 'Performs this action.' })
            async prepare(): Promise<void> {}

            @Action({
                description: 'Performs this action.',
                before: () => [Customer.prototype.prepare],
            })
            async create(): Promise<void> {}
        }

        expect(definitionOf(Customer).actions).toEqual([
            {
                id: 'prepare',
                name: 'prepare',
                label: 'prepare',
                description: 'Performs this action.',
                enabled: true,
                before: [],
            },
            {
                id: 'create',
                name: 'create',
                label: 'create',
                description: 'Performs this action.',
                enabled: true,
                before: [
                    {
                        id: 'prepare',
                        name: 'prepare',
                        label: 'prepare',
                        description: 'Performs this action.',
                        enabled: true,
                        before: [],
                    },
                ],
            },
        ]);
    });

    it('should reject before methods without an action decorator', () => {
        @EntityTypeDef()
        class Customer {
            async prepare(): Promise<void> {}

            @Action({
                description: 'Performs this action.',
                before: () => [Customer.prototype.prepare],
            })
            async create(): Promise<void> {}
        }

        expect(() => definitionOf(Customer)).toThrow('decorated with @Action()');
    });

    it('should declare PoseidonAction as a structure with recursive before actions', () => {
        expect(new Structure()).toBeInstanceOf(Structure);
        const action = new PoseidonAction();
        action.id = 'create';
        action.before = [];
        expect(action).not.toBeInstanceOf(Entity);
        expect(action).toBeInstanceOf(Structure);
        expect(action.id).toBe('create');
        expect(action.before).toEqual([]);
    });

    it('should inherit the entity identifier for EntityType records', () => {
        const entityType = new CoreEntityType();
        entityType._id = 'customer';
        expect(entityType._id).toBe('customer');
        expect(entityType).toBeInstanceOf(Entity);
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

        const model = poseidon.model();
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

        const model = poseidon.model();
        expect(model.entity(Customer).entity(Customer)).toBe(model);
        expect(() => model.entity(OtherCustomer)).toThrow('already declared by another class');
        expect(() => poseidon.model().entity(OtherCustomer)).not.toThrow();
    });

    it('should reject classes without entity metadata', () => {
        class Customer {}
        expect(() => poseidon.model().entity(Customer)).toThrow('must declare @EntityTypeDef()');
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
            @Action({ description: 'Performs this action.' })
            async create(): Promise<void> {}

            @Query({ description: 'Reads data.' })
            async list(): Promise<void> {}
        }
        expect(operationMethodOf(Customer, 'create')).not.toBe(Customer.prototype.create);
        expect(operationMethodOf(Customer, 'list')).not.toBe(Customer.prototype.list);
        expect(() =>
            Query({ description: 'Reads data.' })(Customer.prototype, Symbol('list'), {
                value: () => Promise.resolve(undefined),
            }),
        ).toThrow('string names');
        expect(() => Query({ description: 'Reads data.' })(Customer.prototype, 'list', {})).toThrow(
            'decorate methods',
        );
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
        @Query({ description: 'Reads data.' })
        static list(): Promise<void> {
            return Promise.resolve();
        }
    }
    expect(operationMethodOf(Customer, 'list')).not.toBe(Customer.list);
});
