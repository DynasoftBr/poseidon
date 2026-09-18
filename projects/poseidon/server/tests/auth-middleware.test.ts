import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { DataStorage } from '@poseidon/data-access';
import { createAuthMiddleware, type AuthenticatedRequest } from '../src/auth-middleware';

const secret = 'test-secret';

function testApp(configuredSecret?: string, localDevelopment = false) {
    const get = vi.fn().mockImplementation((_type: string, id: string) =>
        Promise.resolve({
            _id: id,
            _entityTypeId: 'user',
            name: id === 'system' ? 'System' : 'Ada',
        }),
    );
    const auth = createAuthMiddleware(
        { get } as Pick<DataStorage, 'get'>,
        configuredSecret,
        localDevelopment,
    );
    const app = express();
    app.get('/me', auth.authenticate, (req, res) => {
        res.json({ userId: (req as AuthenticatedRequest).user?._id ?? null });
    });
    return { app, auth, get };
}

function bearer(userId = 'ada', expiresIn = '1h'): string {
    return `Bearer ${jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions)}`;
}

describe('auth middleware', () => {
    it('should use the stored system user for missing tokens in local development', async () => {
        const { app, get } = testApp(undefined, true);

        await expect(request(app).get('/me')).resolves.toMatchObject({
            status: 200,
            body: { userId: 'system' },
        });
        expect(get).toHaveBeenCalledWith('user', 'system');

        await expect(
            request(app).get('/me').set('Authorization', 'Bearer invalid'),
        ).resolves.toMatchObject({
            status: 200,
            body: { userId: null },
        });

        get.mockRejectedValueOnce(new Error('System user missing'));
        await expect(request(app).get('/me')).resolves.toMatchObject({
            status: 200,
            body: { userId: null },
        });
    });

    it('should attach the stored user when a valid token is provided', async () => {
        const { app, get } = testApp(secret);

        await expect(request(app).get('/me').set('Authorization', bearer())).resolves.toMatchObject(
            {
                status: 200,
                body: { userId: 'ada' },
            },
        );
        expect(get).toHaveBeenCalledWith('user', 'ada');
    });

    it('should continue with a null user for missing or invalid credentials', async () => {
        const { app, auth, get } = testApp(secret);

        for (const header of [
            undefined,
            'Token x',
            bearer('ada', '-1s'),
            `Bearer ${jwt.sign({ email: 'ada@example.com' }, secret)}`,
            `Bearer ${jwt.sign('ada', secret)}`,
            `Bearer ${jwt.sign({ userId: 'ada' }, 'wrong-secret')}`,
        ]) {
            const call = request(app).get('/me');
            if (header) call.set('Authorization', header);
            await expect(call).resolves.toMatchObject({ status: 200, body: { userId: null } });
        }

        auth.revokeUserId('ada');
        await expect(request(app).get('/me').set('Authorization', bearer())).resolves.toMatchObject(
            {
                status: 200,
                body: { userId: null },
            },
        );

        get.mockRejectedValueOnce(new Error('User not found'));
        await expect(
            request(app).get('/me').set('Authorization', bearer('other')),
        ).resolves.toMatchObject({
            status: 200,
            body: { userId: null },
        });
    });

    it('should continue with a null user when JWT verification is not configured', async () => {
        const { app, get } = testApp();

        await expect(request(app).get('/me').set('Authorization', bearer())).resolves.toMatchObject(
            {
                status: 200,
                body: { userId: null },
            },
        );
        expect(get).not.toHaveBeenCalled();
    });
});
