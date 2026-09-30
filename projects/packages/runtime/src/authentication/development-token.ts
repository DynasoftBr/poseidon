import { createPrivateKey, sign } from 'node:crypto';

const developmentSigningKey = createPrivateKey(`-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIFgoBNccNzGrtuOiyeUjyO881Hh2o7vPa6kuEzgiHzWF
-----END PRIVATE KEY-----`);

type DevelopmentTokenPayload = {
    sub: string;
    permissions: string[];
};

type DevelopmentInvocationTokenPayload = DevelopmentTokenPayload & {
    origin: string;
};

/**
 * Issues a fifteen-minute development token for an authenticated identity.
 * @param {DevelopmentTokenPayload} payload - {@link DevelopmentTokenPayload} to include in the token.
 * @returns {string} Signed development user token.
 */
export function issueDevelopmentToken(payload: DevelopmentTokenPayload): string {
    return issueToken({ kind: 'user', ...payload }, 15 * 60);
}

/**
 * Issues a short-lived token for one authorized operation invocation.
 * @param {DevelopmentInvocationTokenPayload} payload - {@link DevelopmentInvocationTokenPayload} to include in the token.
 * @returns {string} Signed development invocation token.
 */
export function issueDevelopmentInvocationToken(
    payload: DevelopmentInvocationTokenPayload,
): string {
    return issueToken({ kind: 'invocation', ...payload }, 30);
}

function issueToken(payload: object, lifetimeSeconds: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
        JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + lifetimeSeconds }),
    ).toString('base64url');
    const signature = sign(null, Buffer.from(`${header}.${body}`), developmentSigningKey).toString(
        'base64url',
    );
    return `${header}.${body}.${signature}`;
}
