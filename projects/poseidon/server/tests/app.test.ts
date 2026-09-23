import { PoseidonContext, type PoseidonRequest, type PoseidonTransport } from '@poseidon/framework';
import request from 'supertest';
import { createApp } from '../src/app';

class TestTransport implements PoseidonTransport {
    public request?: PoseidonRequest;

    send<TResult>(request: PoseidonRequest, _token: string | undefined): Promise<TResult> {
        this.request = request;
        return Promise.resolve({ _id: 'ada' } as TResult);
    }
}

describe('action endpoint', () => {
    it('should dispatch an action request', async () => {
        const transport = new TestTransport();
        const app = createApp({
            createContext: () => new PoseidonContext(transport, () => undefined),
        });

        await expect(
            request(app)
                .post('/')
                .send({ entityType: 'customer', action: 'onboard', payload: { name: 'Ada' } }),
        ).resolves.toMatchObject({ status: 200, body: { _id: 'ada' } });
        expect(transport.request).toEqual({
            entityType: 'customer',
            action: 'onboard',
            payload: { name: 'Ada' },
        });
    });

    it('should reject requests without an entity type or action', async () => {
        const app = createApp({
            createContext: () => new PoseidonContext(new TestTransport(), () => undefined),
        });
        await expect(request(app).post('/').send({ payload: {} })).resolves.toMatchObject({
            status: 422,
        });
        await expect(
            request(app).post('/').send({ entityType: 'customer' }),
        ).resolves.toMatchObject({ status: 422 });
        await expect(request(app).post('/').send({ action: 'get' })).resolves.toMatchObject({
            status: 422,
        });
    });

    it('should keep health available', async () => {
        const app = createApp({
            createContext: () => new PoseidonContext(new TestTransport(), () => undefined),
        });
        await expect(request(app).get('/health')).resolves.toMatchObject({ status: 200 });
    });
});

it('should forward transport failures to error middleware', async () => {
    const transport: PoseidonTransport = {
        send<TResult>(): Promise<TResult> {
            return Promise.reject(new Error('Unavailable'));
        },
    };
    const app = createApp({ createContext: () => new PoseidonContext(transport, () => undefined) });
    await expect(
        request(app).post('/').send({ entityType: 'customer', action: 'get', payload: {} }),
    ).resolves.toMatchObject({ status: 500 });
});

it('should return null for an undefined operation result and reject an empty body', async () => {
    const transport: PoseidonTransport = {
        send<TResult>(): Promise<TResult> {
            return Promise.resolve(undefined as TResult);
        },
    };
    const app = createApp({ createContext: () => new PoseidonContext(transport, () => undefined) });
    await expect(
        request(app).post('/').send({ entityType: 'customer', action: 'delete', payload: {} }),
    ).resolves.toMatchObject({ status: 200, body: null });
    await expect(request(app).post('/')).resolves.toMatchObject({ status: 422 });
});
