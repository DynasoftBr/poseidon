import type { ContextStore } from './context/context-store';
import type { PoseidonContext } from './context/poseidon-context';
import { ModelBuilder } from './model/model-builder';

let getCurrentContext: () => PoseidonContext = () => {
    throw new Error('Initialize Poseidon before invoking an operation.');
};

/**
 * Gets the context from the initialized Poseidon service locator.
 * @returns {PoseidonContext} The current request or initialized context.
 * @throws If Poseidon has not been initialized.
 * @internal
 */
export function currentContext(): PoseidonContext {
    return getCurrentContext();
}

/**
 * Framework initialization, context access, and model declarations.
 */
export function createPoseidon(contexts: ContextStore) {
    const poseidon = {
        /**
         * Sets the context used outside a request scope.
         * @param {{ context: PoseidonContext }} options - Default runtime or transport context.
         * @returns {void} Nothing.
         */
        initialize(options: { context: PoseidonContext }): void {
            contexts.initialize(options.context);
        },

        /**
         * Returns the context for the current action.
         * @returns {PoseidonContext} Current request or initialized context.
         * @throws If Poseidon has not been initialized.
         */
        context(): PoseidonContext {
            return contexts.context();
        },

        /**
         * Runs an operation in one context scope.
         * @template TResult - Operation result.
         * @param {PoseidonContext} context - Context for the operation.
         * @param {() => Promise<TResult>} operation - Operation to execute.
         * @returns {Promise<TResult>} Resolves to the operation result.
         * @throws If the requested scope is unavailable.
         */
        run<TResult>(
            context: PoseidonContext,
            operation: () => Promise<TResult>,
        ): Promise<TResult> {
            return contexts.run(context, operation);
        },

        /**
         * Creates a builder using the current context.
         * @returns {ModelBuilder} A new model builder.
         * @throws If Poseidon has not been initialized.
         */
        model(): ModelBuilder {
            return new ModelBuilder(contexts.context());
        },
    };

    getCurrentContext = () => poseidon.context();
    return poseidon;
}
