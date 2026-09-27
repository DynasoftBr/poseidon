import { createPrivateKey, sign } from 'node:crypto';

const developmentSigningKey = createPrivateKey(`-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIFgoBNccNzGrtuOiyeUjyO881Hh2o7vPa6kuEzgiHzWF
-----END PRIVATE KEY-----`);

type DevelopmentTokenPayload = {
    sub: string;
    permissions: string[];
};

/**
 * Issues a development token for an authenticated identity.
 * @param {DevelopmentTokenPayload} payload - Identity and direct permissions to include.
 * @returns {string} Signed compact token.
 */
export function issueDevelopmentToken(payload: DevelopmentTokenPayload): string {
    const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = sign(null, Buffer.from(`${header}.${body}`), developmentSigningKey).toString(
        'base64url',
    );
    return `${header}.${body}.${signature}`;
}
