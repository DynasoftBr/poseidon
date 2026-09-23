import type { PoseidonContext } from './poseidon-context';

/**
 * Stores the context used by framework actions.
 * @internal
 */
export interface ContextStore {
    /**
     * Sets the default context.
     * @param {PoseidonContext} context - Context used outside a request scope.
     * @returns {void} Nothing.
     */
    initialize(context: PoseidonContext): void;

    /**
     * Returns the context for the current operation.
     * @returns {PoseidonContext} The current context.
     * @throws If no context is available.
     */
    context(): PoseidonContext;

    /**
     * Runs an operation in one context scope.
     * @template TResult - Operation result.
     * @param {PoseidonContext} context - Context for the operation.
     * @param {() => Promise<TResult>} operation - Operation to execute.
     * @returns {Promise<TResult>} Resolves to the operation result.
     * @throws If the requested scope is unavailable.
     */
    run<TResult>(context: PoseidonContext, operation: () => Promise<TResult>): Promise<TResult>;
}
