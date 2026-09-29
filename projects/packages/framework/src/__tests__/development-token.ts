import { createPrivateKey, sign } from 'node:crypto';

const signingKey = createPrivateKey(`-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIFgoBNccNzGrtuOiyeUjyO881Hh2o7vPa6kuEzgiHzWF
-----END PRIVATE KEY-----`);

export function developmentToken(permissions: string[]): string {
    const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
        JSON.stringify({
            kind: 'user',
            sub: 'test',
            permissions,
            exp: Math.floor(Date.now() / 1000) + 900,
        }),
    ).toString('base64url');
    const signature = sign(null, Buffer.from(`${header}.${payload}`), signingKey).toString(
        'base64url',
    );
    return `${header}.${payload}.${signature}`;
}

export function invocationToken(permissions: string[]): string {
    const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
        JSON.stringify({
            kind: 'invocation',
            sub: 'test',
            origin: 'action:test:entry',
            permissions,
            exp: Math.floor(Date.now() / 1000) + 30,
        }),
    ).toString('base64url');
    const signature = sign(null, Buffer.from(`${header}.${payload}`), signingKey).toString(
        'base64url',
    );
    return `${header}.${payload}.${signature}`;
}
