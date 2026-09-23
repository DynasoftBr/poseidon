import type { PoseidonRequest } from './poseidon-request';
import type { PoseidonTransport } from './poseidon-transport';

/**
 * Sends Poseidon requests to one HTTP endpoint.
 */
export class HttpPoseidonTransport implements PoseidonTransport {
    /**
     * Creates an HTTP transport.
     * @param {string} endpoint - Poseidon action endpoint.
     */
    public constructor(private readonly endpoint: string) {}

    /**
     * Posts a request and reads its JSON result.
     * @template TResult - Action result.
     * @param {PoseidonRequest} request - Action invocation.
     * @param {string | undefined} token - Authorization token.
     * @returns {Promise<TResult>} Resolves to the response body.
     */
    public send<TResult>(request: PoseidonRequest, token: string | undefined): Promise<TResult> {
        return fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(request),
        }).then((response) => response.json() as Promise<TResult>);
    }
}
