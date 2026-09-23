import express from 'express';
import request from 'supertest';
import {
    AccessDeniedError,
    EntityAlreadyExistsError,
    EntityNotFoundError,
    EntityTypeNotFoundError,
    ValidationError,
} from '@poseidon/runtime';
import { errorMiddleware } from '../src/error-middleware';

describe('errorMiddleware', () => {
    it('should return validation problems as an unprocessable entity response', async () => {
        const app = express();
        app.get('/entities', () => {
            throw new ValidationError([{ property: 'name', message: 'Name is required.' }]);
        });
        app.use(errorMiddleware);

        const response = await request(app).get('/entities');

        expect(response.status).toBe(422);
        expect(response.body).toEqual({
            error: {
                code: 'validation',
                message: 'The entity is invalid.',
                problems: [{ property: 'name', message: 'Name is required.' }],
            },
        });
    });

    it('should return not found for missing entity types', async () => {
        const app = express();
        app.get('/entities', () => {
            throw new EntityTypeNotFoundError('Appointment');
        });
        app.use(errorMiddleware);

        const response = await request(app).get('/entities');

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe('entity-type-not-found');
    });
});

it('should return an internal-error response for unknown errors', async () => {
    const app = express();
    app.get('/entities', () => {
        throw new Error('Unavailable');
    });
    app.use(errorMiddleware);
    await expect(request(app).get('/entities')).resolves.toMatchObject({
        status: 500,
        body: { error: { code: 'unexpected-error', message: 'Unexpected error.' } },
    });
});

it.each([
    ['entity-not-found', 404],
    ['entity-already-exists', 409],
    ['access-denied', 403],
])('should map %s errors to %i', async (code, status) => {
    const error =
        code === 'entity-not-found'
            ? new EntityNotFoundError('id')
            : code === 'entity-already-exists'
              ? new EntityAlreadyExistsError('id')
              : new AccessDeniedError();
    const app = express();
    app.get('/entities', () => {
        throw error;
    });
    app.use(errorMiddleware);
    await expect(request(app).get('/entities')).resolves.toMatchObject({ status });
});
