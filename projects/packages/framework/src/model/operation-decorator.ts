import { poseidon } from '../poseidon';
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
import { entityTypeNameOf } from './definition-of';

type OperationKind = 'Action' | 'Query';
// Standard decorator contexts require this callable shape; TypeScript defines it with `any` arguments.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StandardMethod<This> = (this: This, ...args: any[]) => Promise<unknown>;

export function Action(options: ActionOptions) {
    return registerOperation(options, actionsOf, 'Action');
}

export function Query(options: QueryOptions) {
    return registerOperation(options, queriesOf, 'Query');
}

function registerOperation<TOptions extends ActionOptions | QueryOptions>(
    options: TOptions,
    operationsOf: (metadata: DecoratorMetadata) => Map<string, OperationMetadata>,
    kind: OperationKind,
) {
    return <This, Method extends StandardMethod<This>>(
        method: Method,
        context: ClassMethodDecoratorContext<This, Method>,
    ): Method => {
        if (!context.static || context.private || typeof context.name !== 'string') {
            throw new Error(`${kind} methods must be named static methods.`);
        }

        const metadata: OperationMetadata = {
            ...options,
            method: method as ActionMethod,
            name: options.name ?? context.name,
        };
        operationsOf(requiredMetadata(context.metadata)).set(metadata.name, metadata);
        return operationWrapper(metadata) as Method;
    };
}

function operationWrapper(metadata: OperationMetadata): ActionMethod {
    return function (this: object, payload: object): Promise<unknown> {
        return poseidon.context().execute({
            entityType: entityTypeNameOf(this as never),
            action: metadata.name,
            payload,
        });
    };
}
