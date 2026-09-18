import express, { type Express } from 'express';
import type { Entity, EntityData } from '@poseidon/models';
import { ValidationError, type PoseidonContext } from '@poseidon/runtime';
import { errorMiddleware } from './error-middleware';
import type { AuthMiddleware, AuthenticatedRequest } from './auth-middleware';

export interface AppDependencies {
    createContext?: (user: Entity) => PoseidonContext;
    auth?: AuthMiddleware;
}

export function createApp(dependencies: AppDependencies = {}): Express {
    const app = express();
    app.use(express.json());
    app.get('/health', (_request, response) => {
        response.json({ status: 'ok' });
    });
    if (dependencies.auth) app.use(dependencies.auth.authenticate);
    if (dependencies.createContext) configureActions(app, dependencies.createContext);
    app.use(errorMiddleware);
    return app;
}

function configureActions(app: Express, createContext: (user: Entity) => PoseidonContext): void {
    app.post('/:entityTypeName', async (request, response, next) => {
        try {
            const user = (request as AuthenticatedRequest).user;
            if (!user) {
                response.status(401).json({ error: { code: 'unauthenticated' } });
                return;
            }
            const { action, input } = actionRequest(request.body);
            const repository = createContext(user).repository(request.params.entityTypeName);
            const result = await repository.execute(action, input);
            response.status(200).json(result ?? null);
        } catch (error) {
            next(error);
        }
    });
}

function actionRequest(body: unknown): { action: string; input: EntityData } {
    if (!body || typeof body !== 'object') {
        throw new ValidationError([
            { property: 'request', message: 'An action request is required.' },
        ]);
    }
    const { action, input } = body as { action?: unknown; input?: unknown };
    if (
        typeof action !== 'string' ||
        !action ||
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input)
    ) {
        throw new ValidationError([
            { property: 'request', message: 'An action name and input object are required.' },
        ]);
    }
    return { action, input: input as EntityData };
}
