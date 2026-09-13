import type { EntityProjection } from '@poseidon/model';
import {
    type EntityQueryService,
    type EntityService,
    type EntityTypeService,
    ValidationError,
} from '@poseidon/runtime';
import request from 'supertest';
import { createApp } from './app';

describe('createApp', () => {
    it('should expose health without optional services', async () => {
        await expect(request(createApp()).get('/health')).resolves.toMatchObject({
            status: 200,
            body: { status: 'ok' },
        });
    });

    it('should expose every successful API operation', async () => {
        const services = createServices();
        const app = createApp(services);

        await expect(request(app).get('/health')).resolves.toMatchObject({
            status: 200,
            body: { status: 'ok' },
        });
        await expect(
            request(app).post('/api/v1/entity-types').send({ id: 'person' }),
        ).resolves.toMatchObject({
            status: 201,
            body: { id: 'person' },
        });
        await expect(request(app).get('/api/v1/entity-types/person')).resolves.toMatchObject({
            status: 200,
            body: { id: 'person' },
        });
        await expect(
            request(app)
                .post('/api/v1/entities/person')
                .send({ id: 'ada', data: { name: 'Ada' } }),
        ).resolves.toMatchObject({ status: 201, body: { id: 'ada' } });
        await expect(
            request(app)
                .patch('/api/v1/entities/person/ada')
                .send({ expectedVersion: 1, data: { name: 'Ada Byron' } }),
        ).resolves.toMatchObject({ status: 200, body: { id: 'ada' } });
        await expect(
            request(app).delete('/api/v1/entities/person/ada').send({ expectedVersion: 2 }),
        ).resolves.toMatchObject({ status: 204 });
        await expect(
            request(app).post('/api/v1/entities/person/query').send({ limit: 10, offset: 0 }),
        ).resolves.toMatchObject({ status: 200, body: [{ id: 'ada' }] });

        expect(services.entityQueryServiceMock.list).toHaveBeenCalledWith({
            entityTypeId: 'person',
            filter: undefined,
            limit: 10,
            offset: 0,
        });
    });

    it('should return a Poseidon error from an entity route', async () => {
        const services = createServices();
        services.entityServiceMock.create.mockRejectedValue(
            new ValidationError([{ property: 'name', message: 'Name is required.' }]),
        );

        const response = await request(createApp(services))
            .post('/api/v1/entities/person')
            .send({ id: 'ada', data: {} });

        expect(response).toMatchObject({ status: 422, body: { error: { code: 'validation' } } });
    });

    it('should return an unexpected error from a query route', async () => {
        const services = createServices();
        services.entityQueryServiceMock.list.mockRejectedValue(new Error('Database unavailable.'));

        const response = await request(createApp(services))
            .post('/api/v1/entities/person/query')
            .send({});

        expect(response).toMatchObject({
            status: 500,
            body: { error: { code: 'unexpected-error' } },
        });
    });

    it('should forward failures from remaining mutation routes', async () => {
        const services = createServices();
        services.entityTypeServiceMock.get.mockRejectedValue(new Error('Missing type.'));
        services.entityTypeServiceMock.create.mockRejectedValue(new Error('Create type failed.'));
        services.entityServiceMock.update.mockRejectedValue(new Error('Update failed.'));
        services.entityServiceMock.delete.mockRejectedValue(new Error('Delete failed.'));
        const app = createApp(services);

        await expect(request(app).post('/api/v1/entity-types').send({})).resolves.toMatchObject({
            status: 500,
        });
        await expect(request(app).get('/api/v1/entity-types/person')).resolves.toMatchObject({
            status: 500,
        });
        await expect(
            request(app)
                .patch('/api/v1/entities/person/ada')
                .send({ expectedVersion: 1, data: {} }),
        ).resolves.toMatchObject({ status: 500 });
        await expect(
            request(app).delete('/api/v1/entities/person/ada').send({ expectedVersion: 1 }),
        ).resolves.toMatchObject({ status: 500 });
    });
});

function createServices() {
    const entityTypeService = {
        create: vi.fn().mockResolvedValue(projection('person')),
        get: vi.fn().mockResolvedValue(projection('person')),
    };
    const entityService = {
        create: vi.fn().mockResolvedValue(projection('ada')),
        update: vi.fn().mockResolvedValue(projection('ada')),
        delete: vi.fn().mockResolvedValue(undefined),
    };
    const entityQueryService = {
        list: vi.fn().mockResolvedValue([projection('ada')]),
    };

    return {
        entityTypeService: entityTypeService as unknown as EntityTypeService,
        entityService: entityService as unknown as EntityService,
        entityQueryService: entityQueryService as unknown as EntityQueryService,
        entityServiceMock: entityService,
        entityQueryServiceMock: entityQueryService,
        entityTypeServiceMock: entityTypeService,
    };
}

function projection(id: string): EntityProjection {
    return {
        id,
        entityTypeId: 'person',
        data: {},
        version: 1,
        createdAt: new Date(),
        createdById: 'system',
    };
}
