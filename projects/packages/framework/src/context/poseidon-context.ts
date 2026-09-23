import type { PoseidonRequest } from '../transport/poseidon-request';
import type { PoseidonTransport } from '../transport/poseidon-transport';

/**
 * Dispatches requests through a transport with one caller identity.
 */
export class PoseidonContext {
    /**
     * Creates a context for one transport and token provider.
     * @param {PoseidonTransport} transport - Strategy that sends requests.
     * @param {() => string | undefined} getToken - Provider for the caller token.
     */
    public constructor(
        private readonly transport: PoseidonTransport,
        private readonly getToken: () => string | undefined,
    ) {}

    /**
     * Invokes an action and returns its result.
     * @template TResult - Action result.
     * @param {PoseidonRequest} request - Action invocation.
     * @returns {Promise<TResult>} Resolves to the action result.
     * @throws If the action fails.
     */
    public execute<TResult = unknown>(request: PoseidonRequest): Promise<TResult> {
        return this.transport.send<TResult>(request, this.getToken());
    }
}
