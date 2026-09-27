import express, { type Express } from 'express';
import {
    poseidon,
    type EntityTypeFactory,
    type PoseidonContext,
    type PoseidonRequest,
} from '@poseidon/framework';
import { ValidationError } from '@poseidon/runtime';
import { errorMiddleware } from './error-middleware';

export interface AppDependencies {
    createContext: () => PoseidonContext;
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
    createContext: () => PoseidonContext,
    entityTypeFactory: EntityTypeFactory,
): void {
    app.post('/', async (request, response, next) => {
        try {
            const action = actionRequest(request.body);
            const entityType = entityTypeFactory.create(action.entityType);
            const operation = Reflect.get(entityType, action.action) as (
                payload: object,
            ) => Promise<unknown>;
            const result = await poseidon.run(createContext(), () =>
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
    return { entityType, action, payload: payload as object };
}
