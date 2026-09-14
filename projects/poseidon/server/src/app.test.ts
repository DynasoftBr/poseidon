import type { Entity } from '@poseidon/models';
import { type EntityService, ValidationError } from '@poseidon/runtime';
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
        await expect(request(app).get('/api/v1/entities/person/ada')).resolves.toMatchObject({
            status: 200,
            body: { id: 'ada' },
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

        expect(services.entityServiceMock.query).toHaveBeenCalledWith({
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

    it('should reject malformed data and derive UI component contracts', async () => {
        const services = createServices();
        const app = createApp(services);

        await expect(
            request(app).post('/api/v1/entities/person').send({ id: 'ada', data: [] }),
        ).resolves.toMatchObject({ status: 500 });
        await request(app)
            .post('/api/v1/entities/ui-component')
            .send({
                id: 'card',
                data: {
                    name: 'Card',
                    source: {
                        code: 'type Props = { title: string; onOpen(value: string): void }; export default function Card(props: Props) { return null; }',
                    },
                    props: { forged: { type: 'string' } },
                    events: {},
                },
            });

        expect(services.entityServiceMock.create).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    props: { title: { type: 'string', required: true } },
                    events: { onOpen: { type: 'string' } },
                }),
            }),
            'system',
        );
    });

    it('should return an unexpected error from a query route', async () => {
        const services = createServices();
        services.entityServiceMock.query.mockRejectedValue(new Error('Database unavailable.'));

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
        services.entityServiceMock.get.mockRejectedValue(new Error('Missing entity.'));
        services.entityServiceMock.update.mockRejectedValue(new Error('Update failed.'));
        services.entityServiceMock.delete.mockRejectedValue(new Error('Delete failed.'));
        const app = createApp(services);

        await expect(request(app).get('/api/v1/entities/person/ada')).resolves.toMatchObject({
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
    const entityService = {
        create: vi.fn().mockResolvedValue(projection('ada')),
        update: vi.fn().mockResolvedValue(projection('ada')),
        delete: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(projection('ada')),
        query: vi.fn().mockResolvedValue([projection('ada')]),
    };

    return {
        entityService: entityService as unknown as EntityService,
        entityServiceMock: entityService,
    };
}

function projection(id: string): Entity {
    return {
        id,
        entityTypeId: 'person',
        data: {},
        version: 1,
        createdAt: new Date(),
        createdById: 'system',
    };
}
