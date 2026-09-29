import express, { type Express } from 'express';
import {
    Entity,
    operationMethodOf,
    poseidon,
    type EntityTypeFactory,
    type PoseidonContext,
    type PoseidonRequest,
} from '@poseidon/framework';
import { AccessDeniedError, ValidationError } from '@poseidon/runtime';
import { errorMiddleware } from './error-middleware';

export interface AppDependencies {
    createContext: (token: string | undefined) => PoseidonContext;
    entityTypeFactory: EntityTypeFactory;
}

export function createApp(dependencies: AppDependencies): Express {
    const app = express();
    app.use(express.json());
    app.get('/health', (_request, response) => {
        response.json({ status: 'ok' });
    });
    configureActions(app, dependencies.createContext, dependencies.entityTypeFactory);
    app.use(errorMiddleware);
    return app;
}

function configureActions(
    app: Express,
    createContext: (token: string | undefined) => PoseidonContext,
    entityTypeFactory: EntityTypeFactory,
): void {
    app.post('/', async (request, response, next) => {
        try {
            const action = actionRequest(request.body);
            const token = bearerToken(request.headers.authorization);
            if (
                token === undefined &&
                !(action.entityType === 'identity' && action.action === 'authenticate')
            ) {
                throw new AccessDeniedError();
            }
            const entityType = entityTypeFactory.create(action.entityType);
            const operation =
                operationMethodOf(entityType, action.action) ??
                operationMethodOf(Entity, action.action);
            if (!operation) throw new Error(`Operation '${action.action}' does not exist.`);
            const context = createContext(token);
            const result = await poseidon.run(context, () =>
                Reflect.apply(operation, entityType, [action.payload]),
            );
            response.status(200).json(result ?? null);
        } catch (error) {
            next(error);
        }
    });
}

function actionRequest(body: unknown): PoseidonRequest {
    const { entityType, action, payload } = (body || {}) as {
        entityType?: unknown;
        action?: unknown;
        payload?: unknown;
    };
    if (typeof entityType !== 'string' || typeof action !== 'string') {
        throw new ValidationError([
            { property: 'request', message: 'An entity type, action, and payload are required.' },
        ]);
    }
    return {
        entityType,
        action,
        payload: payload as object,
    };
}

function bearerToken(value: string | undefined): string | undefined {
    return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : undefined;
}
