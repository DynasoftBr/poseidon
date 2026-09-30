import type { AuthorizeResult } from '../entity-types/identity';
import { poseidon } from '../poseidon';
import { verifyDevelopmentToken } from '../authentication/development-token';
import { entityTypeNameOf } from './definition-of';
import { operationAddress, type OperationKind } from './operation-address';
import {
    actionsOf,
    queriesOf,
    requiredMetadata,
    type DecoratorMetadata,
} from './decorator-metadata';
import type {
    ActionMethod,
    ActionOptions,
    OperationMetadata,
    QueryOptions,
} from './decorator-types';

type OperationDecoratorKind = 'Action' | 'Query';
// Standard decorator contexts require this callable shape; TypeScript defines it with `any` arguments.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StandardMethod<This> = (this: This, ...args: any[]) => Promise<unknown>;

const operationMetadata = new WeakMap<ActionMethod, OperationMetadata>();

/**
 * Declares an Action and records its permission dependencies.
 * @param {ActionOptions} options - {@link ActionOptions} to register.
 * @returns Decorator that registers the Action.
 */
export function Action(options: ActionOptions) {
    return registerOperation(options, actionsOf, 'Action', 'action');
}

/**
 * Declares a Query and records its permission dependencies.
 * @param {QueryOptions} options - {@link QueryOptions} to register.
 * @returns Decorator that registers the Query.
 */
export function Query(options: QueryOptions) {
    return registerOperation(options, queriesOf, 'Query', 'query');
}

/**
 * Reads metadata registered for a decorated operation method.
 * @param {ActionMethod} method - Decorated {@link ActionMethod} to inspect.
 * @returns {OperationMetadata | undefined} {@link OperationMetadata}, or undefined for an undecorated method.
 */
export function operationMetadataOf(method: ActionMethod): OperationMetadata | undefined {
    return operationMetadata.get(method);
}

function registerOperation<TOptions extends ActionOptions | QueryOptions>(
    options: TOptions,
    operationsOf: (metadata: DecoratorMetadata) => Map<string, OperationMetadata>,
    decoratorKind: OperationDecoratorKind,
    kind: OperationKind,
) {
    return <This, Method extends StandardMethod<This>>(
        method: Method,
        context: ClassMethodDecoratorContext<This, Method>,
    ): Method => {
        if (!context.static || context.private || typeof context.name !== 'string') {
            throw new Error(`${decoratorKind} methods must be named static methods.`);
        }

        const metadata: OperationMetadata = {
            ...options,
            kind,
            method: method as ActionMethod,
            name: options.name ?? context.name,
        };
        operationsOf(requiredMetadata(context.metadata)).set(metadata.name, metadata);
        const wrapper = operationWrapper(metadata);
        operationMetadata.set(wrapper, metadata);
        return wrapper as Method;
    };
}

function operationWrapper(metadata: OperationMetadata): ActionMethod {
    return async function (this: object, payload: object): Promise<unknown> {
        const entityType = entityTypeNameOf(this as never);
        const address = operationAddress(metadata.kind, entityType, metadata.name);
        const context = poseidon.context();

        if (metadata.allows?.length === 0) {
            return Reflect.apply(metadata.method, this, [payload]);
        }

        const token = context.token();
        if (token === undefined) {
            throw new Error(`Operation '${address}' requires authentication.`);
        }

        const authenticated = await verifyDevelopmentToken(token);
        if (authenticated.kind === 'invocation') {
            if (!authenticated.permissions.includes(address)) {
                throw new Error(`Invocation is not authorized for '${address}'.`);
            }
            return Reflect.apply(metadata.method, this, [payload]);
        }

        const { Identity } = await import('../entity-types/identity');
        const authorization = await Identity.authorize<AuthorizeResult>({ operation: address });
        return poseidon.run(context.withToken(authorization.token), () =>
            Reflect.apply(metadata.method, this, [payload]),
        );
    };
}
