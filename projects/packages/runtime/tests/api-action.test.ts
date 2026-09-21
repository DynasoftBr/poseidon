import type { APIAction } from '@poseidon/models';
import * as preparation from '../src/entity-preparation';
import * as mandatoryProperties from '../src/add-mandatory-properties';
import { createCoreEntityTypes } from '../src/system/core-entity-types';
import { RuntimeContext } from '../src/runtime-context';
import { entityType, storage } from './context-test-storage';

function action(name: string, before: APIAction[] = []): APIAction {
    return { id: name, name, label: name, enabled: true, before };
}

describe('APIAction', () => {
    it('should apply defaults before conventions and keep their outputs separate', async () => {
        const conventions = vi.spyOn(preparation, 'applyConventions');
        try {
            const data = storage();
            const type = entityType('customer', {
                properties: [
                    {
                        _id: 'customer:status',
                        name: 'status',
                        type: 'string',
                        default: 'PENDING',
                        convention: 'lower-case',
                    },
                ],
            });
            const repository = new RuntimeContext(data).repository(type);
            expect(await repository.execute('create', { _id: 'ada' })).toEqual({
                _id: 'ada',
                status: 'pending',
            });
            const context = conventions.mock.calls[0][0];
            expect(context.input).toEqual({ _id: 'ada', status: 'pending' });
            expect(context.outputs).toMatchObject({ applyDefaults: null, applyConventions: null });
            expect(await repository.execute('update', { _id: 'ada', status: 'ACTIVE' })).toEqual({
                _id: 'ada',
                status: 'active',
            });
            expect(await repository.execute('validate', {})).toEqual({ valid: true, problems: [] });
        } finally {
            conventions.mockRestore();
        }
    });

    it('should leave input unchanged when preparation before actions are omitted', async () => {
        const data = storage();
        const type = entityType('customer', {
            properties: [
                { _id: 'customer:status', name: 'status', type: 'string', default: 'pending' },
                { _id: 'customer:name', name: 'name', type: 'string', convention: 'lower-case' },
            ],
            actions: [action('create')],
        });
        const repository = new RuntimeContext(data).repository(type);
        expect(await repository.execute('create', { _id: 'ada', name: 'ADA' })).toEqual({
            _id: 'ada',
            name: 'ADA',
        });
    });

    it('should share input mutations and accumulate separate action outputs', async () => {
        const handler = vi.spyOn(mandatoryProperties, 'addMandatoryProperties');
        try {
            const data = storage();
            const type = createCoreEntityTypes().find((type) => type.name === 'entity-type')!;
            type.actions = [
                action('create', [action('validate'), action('addMandatoryProperties')]),
            ];
            const repository = new RuntimeContext(data).repository(type);
            const result = await repository.execute('create', {
                _id: 'customer',
                name: 'customer',
                label: 'Customer',
                properties: [],
            });
            const context = handler.mock.calls[0][0];
            expect(context.input).toMatchObject({
                name: 'customer',
                properties: [{ _id: 'customer:_id', name: '_id', type: 'string', required: true }],
            });
            expect(context.outputs).toEqual({
                validate: { valid: true, problems: [] },
                addMandatoryProperties: null,
                create: result,
            });
            expect(context.input).not.toBe(result);
            expect(await data.get('entity-type', 'customer')).toEqual(result);
        } finally {
            handler.mockRestore();
        }
    });

    it('should run before steps and a built-in action in one transaction', async () => {
        const data = storage();
        const type = entityType('customer', {
            properties: [{ _id: 'customer:name', name: 'name', type: 'string' }],
            actions: [action('update', [action('create')])],
        });
        const repository = new RuntimeContext(data).repository(type);

        const result = await repository.execute('update', { name: 'Ada' });

        expect(result).toEqual({ _id: expect.any(String), name: 'Ada' });
        const id = vi.mocked(data.create).mock.calls[0][1]._id;
        expect(await data.get('customer', id)).toEqual(result);
        expect(data.create).toHaveBeenCalledOnce();
        expect(data.update).toHaveBeenCalledOnce();
        expect(data.commits).toBe(1);
    });

    it('should reject an unimplemented action and roll back its before steps', async () => {
        const data = storage();
        const type = entityType('customer', {
            actions: [action('onboard', [action('create')])],
        });
        const repository = new RuntimeContext(data).repository(type);

        await expect(repository.execute('onboard', { _id: 'ada' })).rejects.toThrow(
            "Action 'onboard' has no implementation.",
        );

        expect(await data.get('customer', 'ada')).toBeNull();
        expect(data.commits).toBe(0);
    });
});
