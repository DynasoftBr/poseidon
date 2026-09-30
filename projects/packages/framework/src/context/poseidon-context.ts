import type { PoseidonRequest } from '../transport/poseidon-request';
import type { PoseidonTransport } from '../transport/poseidon-transport';

/**
 * Dispatches requests through a transport with one caller identity.
 */
export class PoseidonContext {
    /**
     * Creates a context for one transport and token provider.
     * @param {PoseidonTransport} transport - {@link PoseidonTransport} that sends requests.
     * @param {() => string | undefined} getToken - Provider for the caller token.
     */
    public constructor(
        private readonly transport: PoseidonTransport,
        private readonly getToken: () => string | undefined,
    ) {}

    /**
     * Returns the caller token used by this context.
     * @returns {string | undefined} Current caller token, or undefined when no token is available.
     */
    public token(): string | undefined {
        return this.getToken();
    }

    /**
     * Creates a context that preserves this request transport with a scoped token.
     * @param {string} token - Signed development token to verify.
     * @returns {PoseidonContext} A {@link PoseidonContext} using the same transport and the supplied token.
     */
    public withToken(token: string): PoseidonContext {
        return new PoseidonContext(this.transport, () => token);
    }

    /**
     * Invokes an action and returns its result.
     * @template TResult - Action result.
     * @param {PoseidonRequest} request - {@link PoseidonRequest}.
     * @returns {Promise<TResult>} Resolves to the action result.
     * @throws {@link Error} — If the action fails.
     */
    public execute<TResult = unknown>(request: PoseidonRequest): Promise<TResult> {
        return this.transport.send<TResult>(request, this.getToken());
    }
}
