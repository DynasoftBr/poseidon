import type { Entity, APIAction } from '@poseidon/models';
import { RuntimeContext, type UntrustedCodeRunner } from '../src/runtime-context';
import { entity, getEntityType, storage } from './context-test-storage';

function createAction(before: APIAction[] = [], after: APIAction[] = []): APIAction {
    return {
        id: 'create',
        name: 'create',
        label: 'Create',
        enabled: true,
        operation: 'create',
        before,
        after,
    };
}

function scriptStep(id: string, system = false): APIAction {
    return {
        id,
        name: id,
        label: id,
        enabled: true,
        operation: 'script',
        scriptId: id,
        system,
        before: [],
        after: [],
    };
}

describe('APIAction', () => {
    it('should commit before steps and the create together, then run after steps', async () => {
        const check = scriptStep('check-stock');
        const notify = scriptStep('notify-fulfilment');
        const dataStorage = storage([
            entity('order', 'entity-type', {
                name: 'order',
                label: 'order',
                properties: [
                    {
                        _id: 'order:productId',
                        entityTypeId: 'order',
                        name: 'productId',
                        type: 'string',
                    },
                ],
                actions: [createAction([check], [notify])],
            }),
            entity('stock', 'entity-type', {
                name: 'stock',
                label: 'stock',
                properties: [
                    {
                        _id: 'stock:orderId',
                        entityTypeId: 'stock',
                        name: 'orderId',
                        type: 'string',
                    },
                ],
                actions: [createAction()],
            }),
            entity('check-stock', 'script', { code: 'check' }),
            entity('notify-fulfilment', 'script', { code: 'notify' }),
        ]);
        const runner: UntrustedCodeRunner = {
            execute: vi.fn(async (code, context, payload) => {
                if (code === 'check') {
                    expect(payload._createdAt).toBeUndefined();
                    expect(dataStorage.commits).toBe(0);
                    await context
                        .repository(await getEntityType(dataStorage, 'stock'))
                        .execute('create', {
                            _id: 'reservation',
                            orderId: payload._id,
                        });
                    return { payload };
                }
                expect(payload._createdAt).toEqual(expect.any(String));
                expect(dataStorage.commits).toBe(1);
                expect(await dataStorage.get('order', payload._id as string)).not.toBeNull();
                return { output: 'notified' };
            }),
        };
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'), runner);

        const created = (await context
            .repository(await getEntityType(dataStorage, 'order'))
            .execute('create', {
                productId: 'tea',
                _createdAt: 'forged',
            })) as Entity;

        expect(created._createdAt).not.toBe('forged');
        expect((await dataStorage.get('stock', 'reservation'))?.orderId).toBe(created._id);
        expect(dataStorage.commits).toBe(2);
        expect(runner.execute).toHaveBeenCalledTimes(2);
    });

    it('should abort the whole transaction when a before script fails', async () => {
        const dataStorage = storage([
            entity('order', 'entity-type', {
                name: 'order',
                label: 'order',
                properties: [
                    {
                        _id: 'order:productId',
                        entityTypeId: 'order',
                        name: 'productId',
                        type: 'string',
                    },
                ],
                actions: [createAction([scriptStep('reject')])],
            }),
            entity('reject', 'script', { code: 'throw' }),
        ]);
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'), {
            execute: vi.fn().mockRejectedValue(new Error('Stock unavailable')),
        });

        await expect(
            context
                .repository(await getEntityType(dataStorage, 'order'))
                .execute('create', { _id: 'order-1' }),
        ).rejects.toThrow('Stock unavailable');
        expect(await dataStorage.get('order', 'order-1')).toBeNull();
        expect(dataStorage.commits).toBe(0);
    });

    it('should dispatch a known system script from shipped code', async () => {
        const scriptId = 'addMandatoryProperties';
        const dataStorage = storage([
            entity('entity-type', 'entity-type', {
                name: 'entity-type',
                label: 'entity-type',
                properties: [
                    {
                        _id: 'entity-type:name',
                        entityTypeId: 'entity-type',
                        name: 'name',
                        type: 'string',
                    },
                    {
                        _id: 'entity-type:properties',
                        entityTypeId: 'entity-type',
                        name: 'properties',
                        type: 'json',
                    },
                ],
                actions: [createAction([scriptStep(scriptId, true)])],
            }),
            entity(scriptId, 'script', { code: null }),
        ]);
        const runner: UntrustedCodeRunner = { execute: vi.fn() };
        const context = new RuntimeContext(dataStorage, entity('alice', 'user'), runner);

        const created = (await context
            .repository(await getEntityType(dataStorage, 'entity-type'))
            .execute('create', {
                _id: 'product',
                name: 'product',
                properties: [],
            })) as Entity;

        expect(created.properties).toContainEqual(expect.objectContaining({ _id: 'product:_id' }));
        expect(await dataStorage.get('entity-property', 'product:_id')).toBeNull();
        expect(runner.execute).not.toHaveBeenCalled();
    });

    it('should reject a system flag on a script without system ownership', async () => {
        const scriptId = 'addMandatoryProperties';
        const dataStorage = storage([
            entity('entity-type', 'entity-type', {
                name: 'entity-type',
                label: 'entity-type',
                properties: [
                    {
                        _id: 'entity-type:name',
                        entityTypeId: 'entity-type',
                        name: 'name',
                        type: 'string',
                    },
                    {
                        _id: 'entity-type:properties',
                        entityTypeId: 'entity-type',
                        name: 'properties',
                        type: 'json',
                    },
                ],
                actions: [createAction([scriptStep(scriptId, true)])],
            }),
            entity(scriptId, 'script', { code: null, _createdBy: 'alice' }),
        ]);

        await expect(
            new RuntimeContext(dataStorage, entity('alice', 'user'))
                .repository(await getEntityType(dataStorage, 'entity-type'))
                .execute('create', {
                    _id: 'product',
                }),
        ).rejects.toMatchObject({ code: 'validation' });
        expect(await dataStorage.get('entity-type', 'product')).toBeNull();
    });
});
