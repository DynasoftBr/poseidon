import type { ContextStore } from '../context/context-store';
import type { PoseidonContext } from '../context/poseidon-context';

/**
 * Stores the browser application's single session context.
 * @internal
 */
export class BrowserContextStore implements ContextStore {
    private initializedContext?: PoseidonContext;

    /**
     * Sets the browser session context.
     * @param {PoseidonContext} context - Session context.
     * @returns {void} Nothing.
     * @throws If another context has already been initialized.
     */
    public initialize(context: PoseidonContext): void {
        if (this.initializedContext && this.initializedContext !== context) {
            throw new Error('Browser Poseidon context is already initialized.');
        }
        this.initializedContext = context;
    }

    /**
     * Returns the browser session context.
     * @returns {PoseidonContext} Initialized session context.
     * @throws If Poseidon has not been initialized.
     */
    public context(): PoseidonContext {
        if (!this.initializedContext) {
            throw new Error('Initialize Poseidon before calling an action.');
        }
        return this.initializedContext;
    }

    /**
     * Runs only with the initialized browser session context.
     * @template TResult - Operation result.
     * @param {PoseidonContext} context - Requested session context.
     * @param {() => Promise<TResult>} operation - Operation to execute.
     * @returns {Promise<TResult>} Resolves to the operation result.
     * @throws If the context differs from the initialized session context.
     */
    public run<TResult>(
        context: PoseidonContext,
        operation: () => Promise<TResult>,
    ): Promise<TResult> {
        if (context !== this.context()) {
            throw new Error('Browser Poseidon supports only its initialized context.');
        }
        return operation();
    }
}
