import express, { type Express } from 'express';
import type { CreateEntityCommand, CreateEntityTypeCommand } from '@poseidon/model';
import type { EntityQueryService, EntityService, EntityTypeService } from '@poseidon/runtime';
import { errorMiddleware } from './error-middleware';

export interface AppDependencies {
    entityTypeService?: EntityTypeService;
    entityService?: EntityService;
    entityQueryService?: EntityQueryService;
}

export function createApp(dependencies: AppDependencies = {}): Express {
    const app = express();

    app.use(express.json());

    app.get('/health', (_request, response) => {
        response.status(200).json({ status: 'ok' });
    });

    if (dependencies.entityTypeService) {
        configureEntityTypeRoutes(app, dependencies.entityTypeService);
    }
    if (dependencies.entityService) {
        configureEntityRoutes(app, dependencies.entityService);
    }
    if (dependencies.entityQueryService) {
        configureEntityQueryRoutes(app, dependencies.entityQueryService);
    }

    app.use(errorMiddleware);

    return app;
}

function configureEntityQueryRoutes(app: Express, service: EntityQueryService): void {
    app.post('/api/v1/entities/:entityTypeId/query', async (request, response, next) => {
        try {
            const projections = await service.list({
                entityTypeId: request.params.entityTypeId,
                filter: request.body.filter,
                limit: toOptionalNumber(request.body.limit),
                offset: toOptionalNumber(request.body.offset),
            });

            response.status(200).json(projections);
        } catch (error: unknown) {
            next(error);
        }
    });
}

function configureEntityRoutes(app: Express, service: EntityService): void {
    app.post('/api/v1/entities/:entityTypeId', async (request, response, next) => {
        try {
            const projection = await service.create(
                {
                    ...(request.body as Omit<CreateEntityCommand, 'entityTypeId'>),
                    entityTypeId: request.params.entityTypeId,
                },
                'system',
            );

            response.status(201).json(projection);
        } catch (error: unknown) {
            next(error);
        }
    });

    app.patch('/api/v1/entities/:entityTypeId/:id', async (request, response, next) => {
        try {
            const projection = await service.update(
                {
                    entityTypeId: request.params.entityTypeId,
                    id: request.params.id,
                    data: request.body.data,
                    expectedVersion: request.body.expectedVersion,
                },
                'system',
            );

            response.status(200).json(projection);
        } catch (error: unknown) {
            next(error);
        }
    });

    app.delete('/api/v1/entities/:entityTypeId/:id', async (request, response, next) => {
        try {
            await service.delete(
                {
                    entityTypeId: request.params.entityTypeId,
                    id: request.params.id,
                    expectedVersion: request.body.expectedVersion,
                },
                'system',
            );

            response.status(204).end();
        } catch (error: unknown) {
            next(error);
        }
    });
}

function toOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    return Number(value);
}

function configureEntityTypeRoutes(app: Express, service: EntityTypeService): void {
    app.post('/api/v1/entity-types', async (request, response, next) => {
        try {
            const projection = await service.create(
                request.body as CreateEntityTypeCommand,
                'system',
            );

            response.status(201).json(projection);
        } catch (error: unknown) {
            next(error);
        }
    });

    app.get('/api/v1/entity-types/:id', async (request, response, next) => {
        try {
            const projection = await service.get(request.params.id);

            response.status(200).json(projection);
        } catch (error: unknown) {
            next(error);
        }
    });
}
