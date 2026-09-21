import type { Entity, EntityType } from '@poseidon/models';
import { RuntimeContext, ValidationError } from '@poseidon/runtime';
import type { DataStorage } from '@poseidon/data-access';
import request from 'supertest';
import { createApp } from '../src/app';
import { createAuthMiddleware } from '../src/auth-middleware';

function setup() {
    const user: Entity = {
        _id: 'system',
        _entityTypeId: 'user',
        _version: 1,
        _createdAt: new Date().toISOString(),
        _createdBy: 'system',
    };
    const customerType: EntityType = {
        ...user,
        _id: 'customer-type-id',
        _entityTypeId: 'entity-type',
        name: 'customer',
        label: 'Customer',
        properties: [],
    };
    const storage = {
        get: vi.fn().mockResolvedValue(user),
        query: vi.fn().mockResolvedValue([customerType]),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        beginTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
    } satisfies DataStorage;
    const context = new RuntimeContext(storage, user);
    const repository = context.repository(customerType);
    const execute = vi.spyOn(repository, 'execute').mockResolvedValue({ _id: 'ada' });
    const select = vi.spyOn(context, 'repository').mockReturnValue(repository);
    const createContext = vi.fn().mockReturnValue(context);
    const auth = createAuthMiddleware(storage, undefined, true);
    return {
        app: createApp({ createContext, auth }),
        execute,
        select,
        createContext,
        user,
        storage,
        customerType,
    };
}

describe('action endpoint', () => {
    it('should dispatch an entity-scoped action with its input and authenticated user', async () => {
        const services = setup();
        await expect(
            request(services.app)
                .post('/customer')
                .send({ action: 'onboard', input: { name: 'Ada' } }),
        ).resolves.toMatchObject({ status: 200, body: { _id: 'ada' } });
        expect(services.select).toHaveBeenCalledWith(services.customerType);
        expect(services.execute).toHaveBeenCalledWith('onboard', { name: 'Ada' });
        expect(services.createContext).toHaveBeenCalledWith(services.user);
    });
    it('should reject a request when its entity type does not exist', async () => {
        const { app, storage, execute, select } = setup();
        storage.query.mockResolvedValueOnce([]);
        const response = await request(app).post('/missing').send({ action: 'query', input: {} });
        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('entity-type-not-found');
        expect(select).not.toHaveBeenCalled();
        expect(execute).not.toHaveBeenCalled();
    });
    it('should reject structure requests before constructing a runtime repository', async () => {
        const { app, storage, customerType, execute, select } = setup();
        storage.query.mockResolvedValueOnce([{ ...customerType, structure: true }]);
        const response = await request(app).post('/customer').send({ action: 'create', input: {} });
        expect(response.status).toBe(422);
        expect(response.body.error.code).toBe('validation');
        expect(select).not.toHaveBeenCalled();
        expect(execute).not.toHaveBeenCalled();
    });
    it('should use the same contract for reads, queries and deletes', async () => {
        const { app, execute } = setup();
        for (const action of ['get', 'query', 'delete', 'validate']) {
            execute.mockResolvedValueOnce(action === 'delete' ? undefined : []);
            const response = await request(app).post('/customer').send({ action, input: {} });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(action === 'delete' ? null : []);
        }
    });
    it('should reject malformed action requests without dispatching', async () => {
        const { app, execute } = setup();
        for (const body of [
            {},
            { action: '', input: {} },
            { action: 'create' },
            { action: 'create', input: [] },
        ]) {
            expect((await request(app).post('/customer').send(body)).status).toBe(422);
        }
        expect((await request(app).post('/customer')).status).toBe(422);
        expect(execute).not.toHaveBeenCalled();
    });
    it('should require a resolved user before creating a context', async () => {
        const { createContext } = setup();
        expect(
            (
                await request(createApp({ createContext }))
                    .post('/customer')
                    .send({ action: 'query', input: {} })
            ).status,
        ).toBe(401);
        expect(createContext).not.toHaveBeenCalled();
    });
    it('should forward domain and unexpected errors', async () => {
        const { app, execute } = setup();
        execute.mockRejectedValueOnce(
            new ValidationError([{ property: 'name', message: 'Required' }]),
        );
        expect(
            (await request(app).post('/customer').send({ action: 'create', input: {} })).status,
        ).toBe(422);
        execute.mockRejectedValueOnce(new Error('Unavailable'));
        expect(
            (await request(app).post('/customer').send({ action: 'query', input: {} })).status,
        ).toBe(500);
    });
    it('should remove the resource routes while keeping health available', async () => {
        const { app } = setup();
        expect((await request(app).get('/health')).status).toBe(200);
        expect((await request(app).get('/api/v1/entities/customer/ada')).status).toBe(404);
        expect((await request(app).post('/api/v1/entities/customer').send({})).status).toBe(404);
        expect((await request(app).patch('/customer').send({})).status).toBe(404);
        expect((await request(app).delete('/customer')).status).toBe(404);
    });
});
