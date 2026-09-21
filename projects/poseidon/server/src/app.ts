import express, { type Express } from 'express';
import type { EntityData } from '@poseidon/models';
import {
    EntityTypeNotFoundError,
    requireConcreteEntityType,
    ValidationError,
    type RuntimeContext,
} from '@poseidon/runtime';
import { errorMiddleware } from './error-middleware';

export interface AppDependencies {
    createContext: () => RuntimeContext;
}

export function createApp(dependencies: AppDependencies): Express {
    const app = express();
    app.use(express.json());
    app.get('/health', (_request, response) => {
        response.json({ status: 'ok' });
    });
    configureActions(app, dependencies.createContext);
    app.use(errorMiddleware);
    return app;
}

function configureActions(app: Express, createContext: () => RuntimeContext): void {
    app.post('/:entityTypeName', async (request, response, next) => {
        try {
            const { action, input } = actionRequest(request.body);
            const context = createContext();
            const entityType = await context.storage.getEntityType(request.params.entityTypeName);
            if (!entityType) throw new EntityTypeNotFoundError(request.params.entityTypeName);
            requireConcreteEntityType(entityType);
            const repository = context.repository(entityType);
            const result = await repository.execute(action, input);
            response.status(200).json(result ?? null);
        } catch (error) {
            next(error);
        }
    });
}

function actionRequest(body: unknown): { action: string; input: EntityData } {
    const { action, input } = (body || {}) as { action?: unknown; input?: unknown };
    if (typeof action !== 'string' || !action) {
        throw new ValidationError([
            { property: 'request', message: 'An action name and input object are required.' },
        ]);
    }
    return { action, input: input as EntityData };
}
