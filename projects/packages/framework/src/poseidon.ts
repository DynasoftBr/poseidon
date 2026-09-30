import type { ContextStore } from './context/context-store';
import type { PoseidonContext } from './context/poseidon-context';

let contexts: ContextStore | undefined;

function contextStore(): ContextStore {
    if (!contexts) throw new Error('Initialize Poseidon before calling an action.');
    return contexts;
}

/**
 * Configures the context store used by the shared Poseidon API.
 * @param {ContextStore} contextStore - {@link ContextStore} for the current environment.
 * @returns {void} Nothing.
 * @internal
 */
export function configurePoseidon(contextStore: ContextStore): void {
    contexts = contextStore;
}

/**
 * Shared framework API for initialization, context access, and scoped execution.
 */
export const poseidon = {
    /**
     * Sets the context used outside a request scope.
     * @param {{ context: PoseidonContext }} options - Default runtime or transport {@link PoseidonContext}.
     * @returns {void} Nothing.
     */
    initialize(options: { context: PoseidonContext }): void {
        contextStore().initialize(options.context);
    },

    /**
     * Returns the context for the current action.
     * @returns {PoseidonContext} Current request or initialized {@link PoseidonContext}.
     * @throws {@link Error} — If Poseidon has not been initialized.
     */
    context(): PoseidonContext {
        return contextStore().context();
    },

    /**
     * Runs an operation in one context scope.
     * @template TResult - Operation result.
     * @param {PoseidonContext} context - {@link PoseidonContext} for the operation.
     * @param {() => Promise<TResult>} operation - Operation to execute.
     * @returns {Promise<TResult>} Resolves to the operation result.
     * @throws {@link Error} — If the requested scope is unavailable.
     */
    run<TResult>(context: PoseidonContext, operation: () => Promise<TResult>): Promise<TResult> {
        return contextStore().run(context, operation);
    },
};
