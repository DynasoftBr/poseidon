import type { Entity, EntityProperty, APIAction } from '@poseidon/models';
import { createBootstrapModel } from '../src/bootstrap-model';
import { EntityTypeRepository } from '../src/entity-type-repository';
import { RuntimeContext } from '../src/runtime-context';
import { storage } from './context-test-storage';

function setup() {
    const model = createBootstrapModel('system', new Date());
    const data = storage([...model.users, ...model.entityTypes, ...model.scripts]);
    const context = new RuntimeContext(data, model.users[0]);
    return {
        data,
        context,
        types: new EntityTypeRepository(
            model.entityTypes.find((type) => type.name === 'entity-type')!,
            context,
        ),
    };
}
function field(name: string, extras: Partial<EntityProperty> = {}): EntityProperty {
    return { _id: 'customer:' + name, name, type: 'string', ...extras };
}
async function customers() {
    const services = setup();
    await services.types.execute('create', {
        _id: 'customer',
        name: 'customer',
        label: 'Customer',
        properties: [
            field('name', { required: true, convention: 'capitalize-first-letter' }),
            field('email', { convention: 'lower-case' }),
            field('code', { convention: 'upper-case' }),
            field('status', { default: 'new' }),
            field('registeredAt', { type: 'date-time', default: '[[NOW]]' }),
        ],
    });
    return {
        ...services,
        repository: services.context.repository(await services.types.get('customer')),
    };
}

describe('repository mutations', () => {
    it('should prepare and persist a create, patch and delete through built-in actions', async () => {
        const { repository, data } = await customers();
        const created = (await repository.execute('create', {
            _id: 'ada',
            name: 'ada lovelace',
            email: 'ADA@EXAMPLE.COM',
            code: 'ab',
            _createdBy: 'forged',
        })) as Entity;
        expect(created).toMatchObject({
            _id: 'ada',
            _createdBy: 'system',
            _version: 1,
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            code: 'AB',
            status: 'new',
            registeredAt: expect.any(String),
        });
        expect(await repository.execute('get', { _id: 'ada' })).toEqual(created);
        const updated = (await repository.execute('update', {
            _id: 'ada',
            _version: 1,
            name: 'grace hopper',
            _createdBy: 'forged',
        })) as Entity;
        expect(updated).toMatchObject({
            name: 'Grace Hopper',
            email: 'ada@example.com',
            _createdBy: 'system',
            _changedBy: 'system',
            _version: 2,
        });
        await expect(
            repository.execute('update', { _id: 'ada', _version: 1, name: 'Stale' }),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
        await expect(
            repository.execute('delete', { _id: 'ada', _version: 1 }),
        ).rejects.toMatchObject({ code: 'entity-version-conflict' });
        await expect(
            repository.execute('delete', { _id: 'ada', _version: 2 }),
        ).resolves.toBeUndefined();
        expect(await data.get('customer', 'ada')).toBeNull();
        await expect(repository.execute('get', { _id: 'ada' })).rejects.toMatchObject({
            code: 'entity-not-found',
        });
    });
    it('should return validation results without writing and independently validate saves', async () => {
        const { repository, data } = await customers();
        const before = vi.mocked(data.create).mock.calls.length;
        expect(await repository.execute('validate', {})).toMatchObject({
            valid: false,
            problems: [{ property: 'name' }],
        });
        expect(await repository.execute('validate', { name: 'Ada' })).toEqual({
            valid: true,
            problems: [],
        });
        expect(vi.mocked(data.create).mock.calls).toHaveLength(before);
        await expect(repository.execute('create', {})).rejects.toMatchObject({
            code: 'validation',
        });
        await expect(
            repository.execute('create', { name: 'Ada', extra: true }),
        ).rejects.toMatchObject({ code: 'validation' });
    });
    it('should retain mandatory properties and reject renaming entity types', async () => {
        const { types } = await customers();
        const current = await types.get('customer');
        const updated = (await types.execute('update', {
            _id: 'customer',
            _version: current._version,
            properties: [field('name')],
        })) as Entity;
        expect(updated.properties).toContainEqual(expect.objectContaining({ name: '_id' }));
        await expect(
            types.execute('update', {
                _id: 'customer',
                _version: updated._version,
                name: 'renamed',
            }),
        ).rejects.toMatchObject({ code: 'validation' });
        await expect(
            types.execute('create', { name: 'invalid name', label: 'Bad', properties: [] }),
        ).rejects.toMatchObject({ code: 'validation' });
    });
    it('should save object values without looking up other entity types', async () => {
        const { types, context, data } = setup();
        await types.execute('create', {
            _id: 'customer',
            name: 'customer',
            label: 'Customer',
            properties: [
                field('address', { type: 'object' }),
                field('addresses', { type: 'array', itemsType: 'object' }),
            ],
        });
        const repository = context.repository(await types.get('customer'));
        vi.mocked(data.get).mockClear();
        const input = { address: { city: 'London' }, addresses: [{ city: 'Paris' }] };
        expect(await repository.execute('create', input)).toMatchObject(input);
        expect(data.get).not.toHaveBeenCalled();
    });
    it('should dispatch model actions, including rules, and reject missing actions', async () => {
        const { types, context, data } = await customers();
        const current = await types.get('customer');
        const action: APIAction = {
            id: 'approve',
            name: 'approve',
            label: 'Approve',
            operation: 'business-rules',
            enabled: true,
            before: [],
            after: [],
            rules: [
                {
                    id: 'set-status',
                    specification: { kind: 'and', conditions: [] },
                    consequence: {
                        kind: 'set-value',
                        propertyId: 'customer:status',
                        value: 'approved',
                    },
                },
            ],
        };
        await types.execute('update', {
            _id: 'customer',
            _version: current._version,
            actions: [action, { ...action, id: 'disabled', name: 'disabled', enabled: false }],
        });
        const repository = context.repository(await types.get('customer'));
        expect(await repository.execute('approve', { name: 'Ada' })).toMatchObject({
            status: 'approved',
        });
        expect(await repository.execute('disabled', { name: 'Ada' })).toEqual({ name: 'Ada' });
        await repository.execute('query', { limit: -2 });
        expect(data.query).toHaveBeenCalledWith('customer', {
            entityTypeId: 'customer',
            limit: -2,
        });
        await expect(repository.execute('missing', {})).rejects.toThrow('does not exist');
    });
    it('should apply mutation rules and reject implicit nested entity input', async () => {
        const { context, types } = await customers();
        const current = await types.get('customer');
        await types.execute('update', {
            _id: 'customer',
            _version: current._version,
            actions: [
                {
                    id: 'onboard',
                    name: 'onboard',
                    label: 'Onboard',
                    operation: 'create',
                    before: [],
                    after: [],
                    enabled: true,
                    rules: [
                        {
                            id: 'set-status',
                            specification: { kind: 'and', conditions: [] },
                            consequence: {
                                kind: 'set-value',
                                propertyId: 'customer:status',
                                value: 'onboarded',
                            },
                        },
                    ],
                },
            ],
        });
        const repository = context.repository(await types.get('customer'));
        expect(await repository.execute('onboard', { name: 'Ada' })).toMatchObject({
            status: 'onboarded',
        });
        await expect(
            repository.execute('create', { name: { id: 'other', data: { name: 'Nested' } } }),
        ).rejects.toMatchObject({ code: 'validation' });
    });
});
