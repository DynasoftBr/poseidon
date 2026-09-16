import express, { type Express } from 'express';
import type { CreateEntityCommand } from '@poseidon/models';
import type { EntityService } from '@poseidon/runtime';
import { prepareComponentData } from '@poseidon/ui-platform';
import { errorMiddleware } from './error-middleware';
import type { AuthMiddleware } from './auth-middleware';

export interface AppDependencies {
    entityService?: EntityService;
    auth?: AuthMiddleware;
}

export function createApp(dependencies: AppDependencies = {}): Express {
    const app = express();

    app.use(express.json());

    app.get('/health', (_request, response) => {
        response.status(200).json({ status: 'ok' });
    });

    if (dependencies.auth) app.use(dependencies.auth.authenticate);

    if (dependencies.entityService) {
        configureEntityRoutes(app, dependencies.entityService);
    }

    app.use(errorMiddleware);

    return app;
}

function configureEntityRoutes(app: Express, service: EntityService): void {
    configureEntityReadRoutes(app, service);
    configureEntityMutationRoutes(app, service);
}

function configureEntityReadRoutes(app: Express, service: EntityService): void {
    app.get('/api/v1/entities/:entityTypeName/:id', async (request, response, next) => {
        try {
            response
                .status(200)
                .json(await service.get(request.params.entityTypeName, request.params.id));
        } catch (error: unknown) {
            next(error);
        }
    });

    app.post('/api/v1/entities/:entityTypeName/query', async (request, response, next) => {
        try {
            response.status(200).json(
                await service.query({
                    entityTypeId: request.params.entityTypeName,
                    filter: request.body.filter,
                    limit: toOptionalNumber(request.body.limit),
                    offset: toOptionalNumber(request.body.offset),
                }),
            );
        } catch (error: unknown) {
            next(error);
        }
    });
}

function configureEntityMutationRoutes(app: Express, service: EntityService): void {
    app.post('/api/v1/entities/:entityTypeName', async (request, response, next) => {
        try {
            const projection = await service.create(
                {
                    ...(request.body as Omit<CreateEntityCommand, 'entityTypeId'>),
                    data: mutationData(request.params.entityTypeName, {}, request.body.data),
                    entityTypeId: request.params.entityTypeName,
                },
                'system',
            );

            response.status(201).json(projection);
        } catch (error: unknown) {
            next(error);
        }
    });

    app.patch('/api/v1/entities/:entityTypeName/:id', async (request, response, next) => {
        try {
            const current = await service.get(request.params.entityTypeName, request.params.id);
            const projection = await service.update(
                {
                    entityTypeId: request.params.entityTypeName,
                    id: request.params.id,
                    data: mutationData(request.params.entityTypeName, current, request.body.data),
                    expectedVersion: request.body.expectedVersion,
                },
                'system',
            );

            response.status(200).json(projection);
        } catch (error: unknown) {
            next(error);
        }
    });

    app.delete('/api/v1/entities/:entityTypeName/:id', async (request, response, next) => {
        try {
            await service.delete(
                {
                    entityTypeId: request.params.entityTypeName,
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

function mutationData(
    entityTypeId: string,
    current: Record<string, unknown>,
    supplied: unknown,
): Record<string, unknown> {
    if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) {
        throw new Error('Entity data must be an object.');
    }
    return entityTypeId === 'ui-component'
        ? prepareComponentData(current, supplied as Record<string, unknown>)
        : (supplied as Record<string, unknown>);
}

function toOptionalNumber(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    return Number(value);
}
