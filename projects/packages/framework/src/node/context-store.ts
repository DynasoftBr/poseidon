import { AsyncLocalStorage } from 'node:async_hooks';

import type { ContextStore } from '../context/context-store';
import type { PoseidonContext } from '../context/poseidon-context';

/**
 * Stores a default context and request-scoped Node.js contexts.
 * @internal
 */
export class NodeContextStore implements ContextStore {
    private readonly contexts = new AsyncLocalStorage<PoseidonContext>();
    private initializedContext?: PoseidonContext;

    /**
     * Sets the default context used outside request scopes.
     * @param {PoseidonContext} context - Default {@link PoseidonContext}.
     * @returns {void} Nothing.
     */
    public initialize(context: PoseidonContext): void {
        this.initializedContext = context;
    }

    /**
     * Returns the request context or the initialized default context.
     * @returns {PoseidonContext} Current request or default {@link PoseidonContext}.
     * @throws {@link Error} — If Poseidon has not been initialized.
     */
    public context(): PoseidonContext {
        const context = this.contexts.getStore() ?? this.initializedContext;
        if (!context) throw new Error('Initialize Poseidon before calling an action.');
        return context;
    }

    /**
     * Runs an operation with its context isolated from other requests.
     * @template TResult - Operation result.
     * @param {PoseidonContext} context - Request {@link PoseidonContext}.
     * @param {() => Promise<TResult>} operation - Operation to execute.
     * @returns {Promise<TResult>} Resolves to the operation result.
     */
    public run<TResult>(
        context: PoseidonContext,
        operation: () => Promise<TResult>,
    ): Promise<TResult> {
        return this.contexts.run(context, operation);
    }
}
