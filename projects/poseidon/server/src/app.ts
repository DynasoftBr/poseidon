import express, { type Express } from 'express';
import type { Entity, EntityData } from '@poseidon/models';
import {
    createBootstrapModel,
    EntityTypeRepository,
    EntityTypeNotFoundError,
    requireConcreteEntityType,
    ValidationError,
    type RuntimeContext,
} from '@poseidon/runtime';
import { errorMiddleware } from './error-middleware';
import type { AuthMiddleware, AuthenticatedRequest } from './auth-middleware';

export interface AppDependencies {
    createContext: (user: Entity) => RuntimeContext;
    auth?: AuthMiddleware;
}

export function createApp(dependencies: AppDependencies): Express {
    const app = express();
    app.use(express.json());
    app.get('/health', (_request, response) => {
        response.json({ status: 'ok' });
    });
    if (dependencies.auth) app.use(dependencies.auth.authenticate);
    configureActions(app, dependencies.createContext);
    app.use(errorMiddleware);
    return app;
}

function configureActions(app: Express, createContext: (user: Entity) => RuntimeContext): void {
    const entityTypeDefinition = createBootstrapModel('system', new Date()).entityTypes.find(
        (type) => type.name === 'entity-type',
    )!;
    app.post('/:entityTypeName', async (request, response, next) => {
        try {
            const user = (request as AuthenticatedRequest).user;
            if (!user) {
                response.status(401).json({ error: { code: 'unauthenticated' } });
                return;
            }
            const { action, input } = actionRequest(request.body);
            const context = createContext(user);
            const entityTypes = new EntityTypeRepository(entityTypeDefinition, context);
            const entityType = await entityTypes.findByName(request.params.entityTypeName);
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
