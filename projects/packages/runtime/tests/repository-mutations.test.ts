import type { Entity, EntityType, EntityProperty, APIAction } from '@poseidon/models';
import { RuntimeContext } from '../src/runtime-context';
import { entityTypeDefinition, storage } from './context-test-storage';

function setup() {
    const definition = entityTypeDefinition();
    const data = storage({ 'entity-type': [definition] });
    const context = new RuntimeContext(data);
    return {
        data,
        context,
        types: context.repository<EntityType>(definition),
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
    it('should prepare and persist a create, update and delete through built-in actions', async () => {
        const { repository, data } = await customers();
        const created = (await repository.execute('create', {
            _id: 'ada',
            name: 'ada lovelace',
            email: 'ADA@EXAMPLE.COM',
            code: 'ab',
        })) as Entity;
        expect(created).toEqual({
            _id: 'ada',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            code: 'AB',
            status: 'new',
            registeredAt: expect.any(String),
        });
        expect(await repository.execute('get', { _id: 'ada' })).toEqual(created);
        const updated = (await repository.execute('update', {
            ...created,
            name: 'grace hopper',
        })) as Entity;
        expect(updated).toMatchObject({
            name: 'Grace Hopper',
            email: 'ada@example.com',
        });
        await expect(repository.execute('delete', { _id: 'ada' })).resolves.toBeUndefined();
        expect(await data.get('customer', 'ada')).toBeNull();
        await expect(repository.execute('get', { _id: 'ada' })).rejects.toMatchObject({
            code: 'entity-not-found',
        });
    });
    it('should return validation results without writing', async () => {
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
    });
    it('should retain mandatory properties through its before action', async () => {
        const { types } = await customers();
        const updated = (await types.execute('update', {
            _id: 'customer',
            properties: [field('name')],
        })) as Entity;
        expect(updated.properties).toContainEqual(expect.objectContaining({ name: '_id' }));
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
    it('should reject unimplemented and missing actions while skipping disabled actions', async () => {
        const { types, context, data } = await customers();
        const action: APIAction = {
            id: 'onboard',
            name: 'onboard',
            label: 'Onboard',
            enabled: true,
            before: [],
        };
        await types.execute('update', {
            ...(await types.get('customer')),
            actions: [action, { ...action, id: 'disabled', name: 'disabled', enabled: false }],
        });
        const repository = context.repository(await types.get('customer'));
        await expect(repository.execute('onboard', { name: 'Ada' })).rejects.toThrow(
            "Action 'onboard' has no implementation.",
        );
        const writes = vi.mocked(data.create).mock.calls.length;
        expect(await repository.execute('disabled', { name: 'Ada' })).toBeUndefined();
        expect(data.create).toHaveBeenCalledTimes(writes);
        await expect(repository.execute('missing', {})).rejects.toThrow('does not exist');
        await expect(repository.execute('query', {})).rejects.toThrow('does not exist');
    });
    it('should write supplied data without implicit validation or merging', async () => {
        const { repository, data } = await customers();
        await repository.create({ _id: 'raw', extra: true, _custom: 'retained' });
        expect(await data.get('customer', 'raw')).toEqual({
            _id: 'raw',
            extra: true,
            _custom: 'retained',
        });
        await repository.update({ _id: 'raw', replacement: true });
        expect(await data.get('customer', 'raw')).toEqual({ _id: 'raw', replacement: true });
    });
});
