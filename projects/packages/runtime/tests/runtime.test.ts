import {
    definitionOf,
    PoseidonContext,
    poseidon,
    type EntityTypeDefinition,
    type PoseidonRequest,
    type PoseidonTransport,
} from '@poseidon/framework';
import type { MongoClient } from 'mongodb';
import { EntityType } from '../src/entity-types/entity-type';
import { EntityProperty } from '../src/entity-types/entity-property';
import { PoseidonAction } from '../src/entity-types/poseidon-action';
import { PoseidonQuery } from '../src/entity-types/poseidon-query';
import { Runtime } from '../src/runtime';

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
                        records.set(String(value._id), { ...value });
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
                id: 'save',
                name: 'save',
                label: 'save',
                description: 'save operation.',
                enabled: true,
                before: [
                    {
                        id: 'applyDefaults',
                        name: 'applyDefaults',
                        label: 'applyDefaults',
                        description: 'applyDefaults operation.',
                        enabled: true,
                        before: [],
                    },
                    {
                        id: 'applyConventions',
                        name: 'applyConventions',
                        label: 'applyConventions',
                        description: 'applyConventions operation.',
                        enabled: true,
                        before: [],
                    },
                ],
            },
            {
                id: 'delete',
                name: 'delete',
                label: 'delete',
                description: 'delete operation.',
                enabled: true,
                before: [],
            },
        ],
        queries: [
            { id: 'get', name: 'get', label: 'get', description: 'get operation.', enabled: true },
        ],
    };
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
        expect(created).toMatchObject({ _id: 'ada', _version: 1, status: 'new' });
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
});

describe('runtime EntityType operations', () => {
    it('should add mandatory properties and validate submitted entity-type data', async () => {
        const runtime = new Runtime(new MemoryMongo().client());
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'applyDefinitions',
                payload: {
                    definitions: [
                        definitionOf(EntityProperty),
                        definitionOf(PoseidonAction),
                        definitionOf(PoseidonQuery),
                    ],
                },
            },
            undefined,
        );
        await runtime.send(
            {
                entityType: 'entity-type',
                action: 'save',
                payload: { _id: 'address', name: 'address', label: 'Address', properties: [] },
            },
            undefined,
        );
        const address = await runtime.send<EntityTypeDefinition>(
            { entityType: 'entity-type', action: 'get', payload: { _id: 'address' } },
            undefined,
        );
        expect(address.properties).toContainEqual({ name: '_id', type: 'string', required: true });
        await expect(
            runtime.send(
                {
                    entityType: 'entity-type',
                    action: 'validate',
                    payload: { name: 'customer', label: 'Customer', properties: [] },
                },
                undefined,
            ),
        ).resolves.toMatchObject({ valid: true });
        await expect(
            runtime.send(
                {
                    entityType: 'entity-type',
                    action: 'validate',
                    payload: { name: 'customer', properties: [{ type: 'invalid' }] },
                },
                undefined,
            ),
        ).resolves.toMatchObject({ valid: false });
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
            id: 'off',
            name: 'off',
            label: 'off',
            description: 'off operation.',
            enabled: false,
            before: [],
        });
        definition.actions?.push({
            id: 'onboard',
            name: 'onboard',
            label: 'onboard',
            description: 'onboard operation.',
            enabled: true,
            before: [],
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
    poseidon.initialize({ context: new PoseidonContext(new EmptyTransport(), () => undefined) });
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
    expect(new PoseidonAction()).toBeInstanceOf(PoseidonAction);
    expect(new PoseidonQuery()).toBeInstanceOf(PoseidonQuery);
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
            { name: '_id', type: 'string' },
            { name: '_version', type: 'integer' },
        ]),
    );
});
