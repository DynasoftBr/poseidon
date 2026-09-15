import express from 'express';
import request from 'supertest';
import { EntityTypeNotFoundError, ValidationError } from '@poseidon/runtime';
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
