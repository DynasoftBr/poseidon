import {
    definitionOf,
    verifyDevelopmentToken,
    EntityAction as Action,
    EntityProperty,
    EntityQuery as Query,
    PoseidonContext,
    poseidon,
    type EntityTypeDefinition,
    type PoseidonRequest,
    type PoseidonTransport,
} from '@poseidon/framework';
import type { MongoClient } from 'mongodb';
import { EntityType } from '../src/entity-types/entity-type';
import { Runtime } from '../src/runtime';
import {
    issueDevelopmentInvocationToken,
    issueDevelopmentToken,
} from '../src/authentication/development-token';

class MemoryMongo {
    readonly data = new Map<string, Map<string, Record<string, unknown>>>();

    client(): MongoClient {
        return {
            db: () => ({
                collection: <T extends Record<string, unknown>>(name: string) => ({
                    findOne: (filter: Record<string, unknown>) =>
                        (this.data.get(name)?.get(String(filter._id ?? filter.name)) ??
                            null) as T | null,
                    insertOne: (value: T) => {
                        const records = this.records(name);
                        const id = typeof value._id === 'string' ? value._id : String(records.size);
                        records.set(id, { ...value });
                    },
                    createIndex: () => Promise.resolve(name),
                    find: (filter: { endpoints?: { $elemMatch?: Record<string, unknown> } }) => ({
                        toArray: () => {
                            const endpoint = filter.endpoints?.$elemMatch;
                            return [...this.records(name).values()].filter(
                                (record) =>
                                    Array.isArray(record.endpoints) &&
                                    record.endpoints.some(
                                        (candidate) =>
                                            typeof candidate === 'object' &&
                                            candidate !== null &&
                                            Object.entries(endpoint ?? {}).every(
                                                ([key, value]) =>
                                                    (candidate as Record<string, unknown>)[key] ===
                                                    value,
                                            ),
                                    ),
                            ) as T[];
                        },
                    }),
                    deleteMany: (filter: {
                        endpoints?: { $elemMatch?: Record<string, unknown> };
                    }) => {
                        const records = this.records(name);
                        const endpoint = filter.endpoints?.$elemMatch;
                        let deletedCount = 0;
                        for (const [id, record] of records) {
                            if (
                                Array.isArray(record.endpoints) &&
                                record.endpoints.some(
                                    (candidate) =>
                                        typeof candidate === 'object' &&
                                        candidate !== null &&
                                        Object.entries(endpoint ?? {}).every(
                                            ([key, value]) =>
                                                (candidate as Record<string, unknown>)[key] ===
                                                value,
                                        ),
                                )
                            ) {
                                records.delete(id);
                                deletedCount += 1;
                            }
                        }
                        return Promise.resolve({ deletedCount });
                    },
                    replaceOne: (filter: Record<string, unknown>, value: T) => {
                        const records = this.records(name);
                        const id = String(filter._id);
                        const matchedCount = records.has(id) ? 1 : 0;
                        if (matchedCount) records.set(id, { ...value });
                        return { matchedCount };
                    },
                    deleteOne: (filter: Record<string, unknown>) => {
                        const deletedCount = this.records(name).delete(String(filter._id)) ? 1 : 0;
                        return { deletedCount };
                    },
                }),
            }),
            startSession: () => ({
                startTransaction() {},
                commitTransaction: () => Promise.resolve(undefined),
                abortTransaction: () => Promise.resolve(undefined),
                endSession: () => Promise.resolve(undefined),
            }),
        } as unknown as MongoClient;
    }

    records(name: string): Map<string, Record<string, unknown>> {
        const records = this.data.get(name) ?? new Map<string, Record<string, unknown>>();
        this.data.set(name, records);
        return records;
    }
}

function customer(): EntityTypeDefinition {
    return {
        _id: 'customer',
        name: 'customer',
        label: 'Customer',
        properties: [
            { name: 'name', type: 'string' },
            { name: 'status', type: 'string', default: 'NEW', convention: 'lower-case' },
        ],
        actions: [
            {
                _id: 'save',
                name: 'save',
                label: 'save',
                description: 'save operation.',
                permissions: [],
                enabled: true,
            },
            {
                _id: 'delete',
                name: 'delete',
                label: 'delete',
                description: 'delete operation.',
                permissions: [],
                enabled: true,
            },
        ],
        queries: [
            {
                _id: 'get',
                name: 'get',
                label: 'get',
                description: 'get operation.',
                permissions: [],
                enabled: true,
            },
        ],
    };
}

function relationshipDefinitions(
    onDelete: 'detach' | 'cascade' = 'detach',
): EntityTypeDefinition[] {
    const operations = [
        {
            _id: 'save',
            name: 'save',
            label: 'save',
            description: 'save operation.',
            permissions: [],
            enabled: true,
        },
        {
            _id: 'delete',
            name: 'delete',
            label: 'delete',
            description: 'delete operation.',
            permissions: [],
            enabled: true,
        },
    ];
    return [
        {
            _id: 'user',
            name: 'user',
            label: 'User',
            properties: [
                {
                    _id: 'user:createdTickets',
                    name: 'createdTickets',
                    type: 'reference',
                    cardinality: 'many',
                    targetEntityType: { _id: 'ticket' },
                    inverseProperty: { _id: 'ticket:creator' },
                },
            ],
            actions: operations,
        },
        {
            _id: 'ticket',
            name: 'ticket',
            label: 'Ticket',
            properties: [
                {
                    _id: 'ticket:creator',
                    name: 'creator',
                    type: 'reference',
                    cardinality: 'one',
                    onDelete,
                    targetEntityType: { _id: 'user' },
                    inverseProperty: { _id: 'user:createdTickets' },
                },
            ],
            actions: operations,
        },
    ];
}

describe('Runtime', () => {
    it('should apply definitions and execute entity operations', async () => {
        const memory = new MemoryMongo();
        const runtime = new Runtime(memory.client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: [customer()] },
            },
            undefined,
        );
        const created = await runtime.send<Record<string, unknown>>(
            { entityType: 'customer', action: 'save', payload: { _id: 'ada', name: 'Ada' } },
            undefined,
        );
        expect(created).toMatchObject({ _id: 'ada', _version: 1 });
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'get', payload: { _id: 'ada' } },
                undefined,
            ),
        ).resolves.toMatchObject({ name: 'Ada' });
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'delete', payload: { _id: 'ada', _version: 1 } },
                undefined,
            ),
        ).resolves.toBeUndefined();
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'get', payload: { _id: 'ada' } },
                undefined,
            ),
        ).rejects.toMatchObject({ code: 'entity-not-found' });
    });

    it('should persist references separately from entity records', async () => {
        const memory = new MemoryMongo();
        const runtime = new Runtime(memory.client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: relationshipDefinitions() },
            },
            undefined,
        );
        await runtime.send(
            { entityType: 'user', action: 'save', payload: { _id: 'ada' } },
            undefined,
        );
        await runtime.send(
            {
                entityType: 'ticket',
                action: 'save',
                payload: { _id: 'ticket-1', creator: { _id: 'ada' } },
            },
            undefined,
        );

        expect(memory.records('ticket').get('ticket-1')).toEqual({ _id: 'ticket-1', _version: 1 });
        expect([...memory.records('relationship').values()]).toEqual([
            {
                endpoints: [
                    { entityPropertyId: 'ticket:creator', entityId: 'ticket-1' },
                    { entityPropertyId: 'user:createdTickets', entityId: 'ada' },
                ],
                uniqueEndpointKeys: ['ticket:creator:ticket-1'],
            },
        ]);

        await expect(
            runtime.send(
                { entityType: 'user', action: 'delete', payload: { _id: 'ada', _version: 1 } },
                undefined,
            ),
        ).rejects.toThrow("Relationship 'createdTickets' prevents deleting 'ada'.");

        await runtime.send(
            { entityType: 'ticket', action: 'delete', payload: { _id: 'ticket-1', _version: 1 } },
            undefined,
        );
        expect(memory.records('relationship')).toHaveLength(0);
        await expect(runtime.get('user', 'ada', true)).resolves.toMatchObject({ _id: 'ada' });
    });

    it('should replace and clear a direct relationship', async () => {
        const memory = new MemoryMongo();
        const runtime = new Runtime(memory.client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: relationshipDefinitions() },
            },
            undefined,
        );
        await runtime.send(
            { entityType: 'user', action: 'save', payload: { _id: 'ada' } },
            undefined,
        );
        await runtime.send(
            {
                entityType: 'ticket',
                action: 'save',
                payload: { _id: 'ticket-1', creator: { _id: 'ada' } },
            },
            undefined,
        );
        await runtime.send(
            {
                entityType: 'ticket',
                action: 'save',
                payload: { _id: 'ticket-1', _version: 1, creator: null },
            },
            undefined,
        );

        expect(memory.records('relationship')).toHaveLength(0);
    });

    it('should reject a relationship value that is not an entity reference', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: relationshipDefinitions() },
            },
            undefined,
        );

        await expect(
            runtime.send(
                {
                    entityType: 'ticket',
                    action: 'save',
                    payload: { _id: 'ticket-1', creator: 'ada' },
                },
                undefined,
            ),
        ).rejects.toThrow("Relationship 'creator' must provide an entity reference.");
    });

    it('should require relationship endpoint metadata', async () => {
        const missingTarget = relationshipDefinitions();
        missingTarget[1]!.properties[0]!.targetEntityType = undefined;
        const targetRuntime = new Runtime(new MemoryMongo().client());
        await targetRuntime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: missingTarget },
            },
            undefined,
        );
        await expect(
            targetRuntime.send(
                {
                    entityType: 'ticket',
                    action: 'save',
                    payload: { _id: 'ticket-1', creator: { _id: 'ada' } },
                },
                undefined,
            ),
        ).rejects.toThrow("Relationship 'creator' must declare a target entity type.");

        const missingInverse = relationshipDefinitions();
        missingInverse[1]!.properties[0]!.inverseProperty = undefined;
        const inverseRuntime = new Runtime(new MemoryMongo().client());
        await inverseRuntime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: missingInverse },
            },
            undefined,
        );
        await expect(
            inverseRuntime.send(
                {
                    entityType: 'ticket',
                    action: 'save',
                    payload: { _id: 'ticket-1', creator: { _id: 'ada' } },
                },
                undefined,
            ),
        ).rejects.toThrow("Relationship 'creator' must declare an inverse property.");
    });

    it('should cascade deletion through a relationship', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: relationshipDefinitions('cascade') },
            },
            undefined,
        );
        await runtime.send(
            { entityType: 'user', action: 'save', payload: { _id: 'ada' } },
            undefined,
        );
        await runtime.send(
            {
                entityType: 'ticket',
                action: 'save',
                payload: { _id: 'ticket-1', creator: { _id: 'ada' } },
            },
            undefined,
        );

        await runtime.send(
            { entityType: 'ticket', action: 'delete', payload: { _id: 'ticket-1', _version: 1 } },
            undefined,
        );

        await expect(runtime.get('user', 'ada', true)).rejects.toMatchObject({
            code: 'entity-not-found',
        });
    });

    it('should expose the runtime EntityType definition during bootstrap', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await expect(
            runtime.send(
                {
                    entityType: definitionOf(EntityType).name,
                    action: 'get',
                    payload: { _id: 'missing' },
                },
                undefined,
            ),
        ).rejects.toMatchObject({ code: 'entity-not-found' });
    });

    it('should issue a signed token containing identity permissions', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        const definition = customer();
        definition.actions?.push({
            _id: 'action:customer:onboard',
            name: 'onboard',
            label: 'onboard',
            description: 'Onboards a customer.',
            permissions: [],
            enabled: true,
        });
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: [definition] },
            },
            undefined,
        );
        await runtime.send(
            {
                entityType: 'identity',
                action: 'save',
                payload: {
                    _id: 'ada-identity',
                    kind: 'user',
                    permissions: [
                        {
                            entityTypeId: 'customer',
                            operationId: 'action:customer:onboard',
                        },
                    ],
                },
            },
            undefined,
        );

        const result = await runtime.send<{ token: string }>(
            {
                entityType: 'identity',
                action: 'authenticate',
                payload: { identityId: 'ada-identity', secret: 'development-secret' },
            },
            undefined,
        );
        const payload = JSON.parse(
            Buffer.from(result.token.split('.')[1]!, 'base64url').toString(),
        ) as { sub: string; permissions: string[] };

        expect(result.token.split('.')).toHaveLength(3);
        expect(payload).toMatchObject({
            sub: 'ada-identity',
            permissions: ['action:customer:onboard'],
            exp: expect.any(Number),
        });
    });

    it('should reject authentication by a group identity', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'identity',
                action: 'save',
                payload: { _id: 'staff', kind: 'group', permissions: [] },
            },
            undefined,
        );

        await expect(
            runtime.send(
                {
                    entityType: 'identity',
                    action: 'authenticate',
                    payload: { identityId: 'staff', secret: 'development-secret' },
                },
                undefined,
            ),
        ).rejects.toThrow('Group identities cannot authenticate.');
    });

    it('should create a user with a user identity', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        const user = await runtime.send<Record<string, unknown>>(
            { entityType: 'user', action: 'save', payload: { _id: 'ada' } },
            undefined,
        );

        expect(user).toMatchObject({ _id: 'ada', _version: 1 });
        expect(user.identityId).toEqual(expect.any(String));
        await expect(runtime.get('identity', String(user.identityId), true)).resolves.toMatchObject(
            { _id: user.identityId, kind: 'user', _version: 1 },
        );
    });
});

describe('runtime EntityType operations', () => {
    it('should add mandatory properties and validate submitted entity-type data', async () => {
        class TestEntityType extends EntityType {
            static prepare(context: object): Promise<EntityTypeDefinition> {
                return this.addMandatoryProperties<EntityTypeDefinition>(context);
            }
        }

        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: {
                    definitions: [
                        definitionOf(EntityProperty),
                        definitionOf(Action),
                        definitionOf(Query),
                    ],
                },
            },
            undefined,
        );
        const address: EntityTypeDefinition = {
            _id: 'address',
            name: 'address',
            label: 'Address',
            properties: [],
        };
        await TestEntityType.prepare({
            runtime,
            entityType: definitionOf(EntityType),
            input: address,
            outputs: {},
        });
        await runtime.send(
            { entityType: 'entity-type', action: 'save', payload: address },
            undefined,
        );
        expect(address.properties).toContainEqual({ name: '_id', type: 'string', required: true });
        await expect(
            runtime.send(
                {
                    entityType: 'entity-type',
                    action: 'validate',
                    payload: {
                        _id: 'customer',
                        name: 'customer',
                        label: 'Customer',
                        properties: [],
                    },
                },
                undefined,
            ),
        ).resolves.toBeUndefined();
        await expect(
            runtime.send(
                {
                    entityType: 'entity-type',
                    action: 'validate',
                    payload: {
                        _id: 'customer',
                        name: 'customer',
                        properties: [{ type: 'invalid' }],
                    },
                },
                undefined,
            ),
        ).rejects.toMatchObject({ code: 'validation' });
    });

    it('should preserve structure property declarations', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'save',
                payload: {
                    _id: 'address',
                    name: 'address',
                    label: 'Address',
                    structure: true,
                    properties: [],
                },
            },
            undefined,
        );
        await expect(
            runtime.send(
                { entityType: 'entity-type', action: 'get', payload: { _id: 'address' } },
                undefined,
            ),
        ).resolves.toMatchObject({ properties: [] });
    });

    it('should reject disabled, missing, and unimplemented operations', async () => {
        const memory = new MemoryMongo();
        const runtime = new Runtime(memory.client());
        const definition = customer();
        definition.actions?.push({
            _id: 'off',
            name: 'off',
            label: 'off',
            description: 'off operation.',
            permissions: [],
            enabled: false,
        });
        definition.actions?.push({
            _id: 'onboard',
            name: 'onboard',
            label: 'onboard',
            description: 'onboard operation.',
            permissions: [],
            enabled: true,
        });
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: [definition] },
            },
            undefined,
        );
        await expect(
            runtime.send({ entityType: 'customer', action: 'off', payload: {} }, undefined),
        ).resolves.toBeUndefined();
        await expect(
            runtime.send({ entityType: 'customer', action: 'onboard', payload: {} }, undefined),
        ).rejects.toThrow('no implementation');
        await expect(
            runtime.send({ entityType: 'customer', action: 'missing', payload: {} }, undefined),
        ).rejects.toThrow('does not exist');
    });

    it('should authorize direct and delegated operations from a signed token', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        const definition: EntityTypeDefinition = {
            _id: 'customer',
            name: 'customer',
            label: 'Customer',
            properties: [],
            actions: [
                {
                    _id: 'action:customer:save',
                    name: 'save',
                    label: 'save',
                    description: 'Saves a customer.',
                    permissions: [{ entityTypeId: 'customer', operationId: 'query:customer:get' }],
                    enabled: true,
                },
                {
                    _id: 'action:customer:onboard',
                    name: 'onboard',
                    label: 'onboard',
                    description: 'Onboards a customer.',
                    permissions: [
                        { entityTypeId: 'customer', operationId: 'action:customer:save' },
                    ],
                    enabled: true,
                },
            ],
            queries: [
                {
                    _id: 'query:customer:get',
                    name: 'get',
                    label: 'get',
                    description: 'Gets a customer.',
                    permissions: [
                        { entityTypeId: 'customer', operationId: 'action:customer:save' },
                    ],
                    enabled: true,
                },
                {
                    _id: 'query:customer:project',
                    name: 'project',
                    label: 'project',
                    description: 'Projects a customer.',
                    permissions: [{ entityTypeId: 'customer', operationId: 'query:customer:get' }],
                    enabled: true,
                },
            ],
        };
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: [definition] },
            },
            undefined,
        );

        const direct = issueDevelopmentToken({
            sub: 'ada',
            permissions: ['action:customer:save', 'query:customer:get'],
        });
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'save', payload: { _id: 'ada' } },
                direct,
            ),
        ).resolves.toMatchObject({ _id: 'ada' });
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'get', payload: { _id: 'ada' } },
                direct,
            ),
        ).resolves.toMatchObject({ _id: 'ada' });

        const delegated = await runtime.send<{ token: string }>(
            {
                entityType: 'identity',
                action: 'authorize',
                payload: { operation: 'action:customer:onboard' },
            },
            issueDevelopmentToken({
                sub: 'ada',
                permissions: ['action:customer:onboard'],
            }),
        );
        await expect(verifyDevelopmentToken(delegated.token)).resolves.toMatchObject({
            kind: 'invocation',
            origin: 'action:customer:onboard',
            permissions: ['action:customer:onboard', 'action:customer:save', 'query:customer:get'],
        });
        await expect(
            runtime.send(
                {
                    entityType: 'customer',
                    action: 'save',
                    payload: { _id: 'grace' },
                },
                delegated.token,
            ),
        ).resolves.toMatchObject({ _id: 'grace' });
        await expect(
            runtime.send(
                {
                    entityType: 'customer',
                    action: 'get',
                    payload: { _id: 'grace' },
                },
                delegated.token,
            ),
        ).resolves.toMatchObject({ _id: 'grace' });

        const queryDelegated = issueDevelopmentInvocationToken({
            sub: 'ada',
            origin: 'query:customer:project',
            permissions: ['query:customer:get', 'action:customer:save'],
        });
        await expect(
            runtime.send(
                {
                    entityType: 'customer',
                    action: 'get',
                    payload: { _id: 'ada' },
                },
                queryDelegated,
            ),
        ).resolves.toMatchObject({ _id: 'ada' });
        await expect(
            runtime.send(
                {
                    entityType: 'customer',
                    action: 'save',
                    payload: { _id: 'lin' },
                },
                queryDelegated,
            ),
        ).resolves.toMatchObject({ _id: 'lin' });
        await expect(
            runtime.operationAddress({
                entityTypeId: 'customer',
                operationId: 'query:customer:get',
            }),
        ).resolves.toBe('query:customer:get');
        await expect(
            runtime.operationAddress({ entityTypeId: 'customer', operationId: 'missing' }),
        ).rejects.toMatchObject({ code: 'entity-not-found' });
    });

    it('should reject a delegated operation reference that does not exist', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: {
                    definitions: [
                        {
                            _id: 'customer',
                            name: 'customer',
                            label: 'Customer',
                            properties: [],
                            actions: [
                                {
                                    _id: 'action:customer:onboard',
                                    name: 'onboard',
                                    label: 'onboard',
                                    description: 'Onboards a customer.',
                                    permissions: [
                                        {
                                            entityTypeId: 'customer',
                                            operationId: 'action:customer:missing',
                                        },
                                    ],
                                    enabled: true,
                                },
                            ],
                        },
                    ],
                },
            },
            undefined,
        );

        await expect(
            runtime.resolveAllOperationPermissions('action:customer:onboard'),
        ).rejects.toMatchObject({ code: 'entity-not-found' });
        await expect(runtime.resolveAllOperationPermissions('invalid')).rejects.toThrow(
            "Operation 'invalid' does not exist.",
        );
    });

    it('should reject insufficient and invalid runtime authorization', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        const definition: EntityTypeDefinition = {
            _id: 'customer',
            name: 'customer',
            label: 'Customer',
            properties: [],
            actions: [
                {
                    _id: 'action:customer:save',
                    name: 'save',
                    label: 'save',
                    description: 'Saves a customer.',
                    permissions: [],
                    enabled: true,
                },
                {
                    _id: 'action:customer:onboard',
                    name: 'onboard',
                    label: 'onboard',
                    description: 'Onboards a customer.',
                    permissions: [],
                    enabled: true,
                },
            ],
        };
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: { definitions: [definition] },
            },
            undefined,
        );
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'save', payload: {} },
                issueDevelopmentToken({ sub: 'ada', permissions: [] }),
            ),
        ).rejects.toThrow('not authorized');
        await expect(
            runtime.send(
                { entityType: 'customer', action: 'save', payload: {} },
                issueDevelopmentInvocationToken({
                    sub: 'ada',
                    origin: 'action:customer:onboard',
                    permissions: [],
                }),
            ),
        ).rejects.toThrow('not authorized');
        await expect(
            runtime.send(
                {
                    entityType: 'identity',
                    action: 'authorize',
                    payload: { operation: 'action:customer:onboard' },
                },
                issueDevelopmentInvocationToken({
                    sub: 'ada',
                    origin: 'action:customer:onboard',
                    permissions: [],
                }),
            ),
        ).rejects.toThrow('requires a user token');
        await expect(
            runtime.send(
                {
                    entityType: 'identity',
                    action: 'authorize',
                    payload: { operation: 'action:customer:onboard' },
                },
                issueDevelopmentToken({ sub: 'ada', permissions: [] }),
            ),
        ).rejects.toThrow('is not authorized');
    });
});

import { applyConventions, applyDefaults } from '../src/actions/entity-preparation';
import { addMandatoryProperties } from '../src/actions/add-mandatory-properties';
import {
    AccessDeniedError,
    EntityAlreadyExistsError,
    EntityNotFoundError,
    EntityTypeNotFoundError,
} from '../src/poseidon-error';

it('should apply defaults and every convention', async () => {
    const state: { input: Record<string, unknown>; outputs: Record<string, unknown> } = {
        input: { keep: 'value', lower: 'ADA', upper: 'ada', title: 'ada LOVELACE' },
        outputs: {},
    };

    await applyDefaults(state, [
        { name: 'now', type: 'date-time', default: '[[NOW]]' },
        { name: 'keep', type: 'string', default: 'other' },
        { name: 'plain', type: 'string', default: 'value' },
    ]);
    await applyConventions(state, [
        { name: 'lower', type: 'string', convention: 'lower-case' },
        { name: 'upper', type: 'string', convention: 'upper-case' },
        { name: 'title', type: 'string', convention: 'capitalize-first-letter' },
        { name: 'keep', type: 'string' },
    ]);
    expect(state.input).toMatchObject({
        lower: 'ada',
        upper: 'ADA',
        title: 'Ada Lovelace',
        plain: 'value',
    });
    expect(state.input.now).toEqual(expect.any(String));
});

it('should handle mandatory property edge cases', async () => {
    const runtime = new Runtime(new MemoryMongo().client());
    await expect(addMandatoryProperties({ input: {}, outputs: {} }, runtime)).resolves.toBeNull();
    await expect(
        addMandatoryProperties({ input: { properties: [] }, outputs: {} }, runtime),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
        addMandatoryProperties(
            { input: { _id: 'address', structure: true, properties: [] }, outputs: {} },
            runtime,
        ),
    ).resolves.toBeNull();
});

it('should expose all domain error types', () => {
    expect(new EntityNotFoundError('id').code).toBe('entity-not-found');
    expect(new EntityTypeNotFoundError('type').code).toBe('entity-type-not-found');
    expect(new EntityAlreadyExistsError('id').code).toBe('entity-already-exists');
    expect(new AccessDeniedError().code).toBe('access-denied');
});

class EmptyTransport implements PoseidonTransport {
    send<TResult>(_request: PoseidonRequest, _token: string | undefined): Promise<TResult> {
        return Promise.resolve(undefined as TResult);
    }
}

it('should cover runtime entity-type facades and update paths', async () => {
    poseidon.initialize({
        context: new PoseidonContext(new EmptyTransport(), () =>
            issueDevelopmentInvocationToken({
                sub: 'test',
                origin: 'action:test:entry',
                permissions: ['query:entity-type:get', 'action:entity-type:save'],
            }),
        ),
    });
    await EntityType.get({ _id: 'customer' });
    await EntityType.save({
        _id: 'customer',
        _version: 1,
        name: 'customer',
        label: 'Customer',
        properties: [],
    });
    const memory = new MemoryMongo();
    const runtime = new Runtime(memory.client());
    await runtime.send(
        {
            entityType: 'entity-type',
            action: 'applyDefinitions',
            payload: { definitions: [customer()] },
        },
        undefined,
    );
    await runtime.send(
        { entityType: 'customer', action: 'save', payload: { _id: 'ada', name: 'Ada' } },
        undefined,
    );
    await runtime.send(
        {
            entityType: 'customer',
            action: 'save',
            payload: { _id: 'ada', _version: 1, name: 'Grace' },
        },
        undefined,
    );
    await expect(
        runtime.send({ entityType: 'customer', action: 'get', payload: { _id: 'ada' } }, undefined),
    ).resolves.toMatchObject({ name: 'Grace' });
    await runtime.send(
        {
            entityType: 'entity-type',
            action: 'applyDefinitions',
            payload: { definitions: [{ ...customer(), structure: true }] },
        },
        undefined,
    );
    await expect(runtime.save(customer(), { _id: 'x' })).rejects.toThrow('cannot be persisted');
});

it('should instantiate runtime structures', () => {
    expect(new EntityProperty()).toBeInstanceOf(EntityProperty);
    expect(new Action()).toBeInstanceOf(Action);
    expect(new Query()).toBeInstanceOf(Query);
});

it('should retain mandatory properties from an existing entity type', async () => {
    const runtime = new Runtime(new MemoryMongo().client());
    await runtime.send(
        {
            entityType: 'entity-type',
            action: 'applyDefinitions',
            payload: {
                definitions: [
                    {
                        ...customer(),
                        properties: [
                            { name: '_id', type: 'string' },
                            { name: '_version', type: 'integer' },
                        ],
                    },
                ],
            },
        },
        undefined,
    );
    const input = { _id: 'customer', properties: [{ name: 'name', type: 'string' }] };
    await addMandatoryProperties({ input, outputs: {} }, runtime);
    expect(input.properties).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ name: '_id', type: 'string' }),
            expect.objectContaining({ name: '_version', type: 'integer' }),
        ]),
    );
});
