import type { PoseidonRequest } from './poseidon-request';

/**
 * Sends Poseidon requests through one transport mechanism.
 */
export interface PoseidonTransport {
    /**
     * Sends a request with the current authorization token.
     * @template TResult - Action result.
     * @param {PoseidonRequest} request - {@link PoseidonRequest}.
     * @param {string | undefined} token - Current authorization token.
     * @returns {Promise<TResult>} Resolves to the action result.
     */
    send<TResult>(request: PoseidonRequest, token: string | undefined): Promise<TResult>;
}
