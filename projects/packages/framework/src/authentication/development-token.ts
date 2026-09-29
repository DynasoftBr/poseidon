const developmentVerificationKey = {
    crv: 'Ed25519',
    kty: 'OKP',
    x: 'amw6T4QUqQWdbzFWuejy_tg8D5UoEYG9X8e9YAXU4oI',
} as const;

export type DevelopmentUserToken = {
    kind: 'user';
    sub: string;
    permissions: string[];
    exp: number;
};

export type DevelopmentInvocationToken = {
    kind: 'invocation';
    sub: string;
    origin: string;
    permissions: string[];
    exp: number;
};

export type DevelopmentToken = DevelopmentUserToken | DevelopmentInvocationToken;

/** Verifies the fixed-key development token issued by the runtime. */
export async function verifyDevelopmentToken(token: string): Promise<DevelopmentToken> {
    const [header, payload, signature] = tokenParts(token);
    const parsedPayload = validatedPayload(payload);
    const key = await crypto.subtle.importKey(
        'jwk',
        developmentVerificationKey,
        { name: 'Ed25519' },
        false,
        ['verify'],
    );
    const verified = await crypto.subtle.verify(
        'Ed25519',
        key,
        decodeBase64Url(signature),
        new TextEncoder().encode(`${header}.${payload}`),
    );
    if (!verified) throw new Error('The token is invalid.');
    return parsedPayload;
}

function tokenParts(token: string): [string, string, string] {
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra !== undefined) {
        throw new Error('The token is invalid.');
    }
    const parsedHeader = decodeJson<{ alg?: unknown; typ?: unknown }>(header);
    if (parsedHeader.alg !== 'EdDSA' || parsedHeader.typ !== 'JWT') {
        throw new Error('The token is invalid.');
    }
    return [header, payload, signature];
}

function validatedPayload(value: string): DevelopmentToken {
    const payload = decodeJson<Partial<DevelopmentToken>>(value);
    if (!isDevelopmentToken(payload)) throw new Error('The token is invalid.');
    if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('The token has expired.');
    return payload;
}

function isDevelopmentToken(payload: Partial<DevelopmentToken>): payload is DevelopmentToken {
    return (
        (payload.kind === 'user' ||
            (payload.kind === 'invocation' && typeof payload.origin === 'string')) &&
        typeof payload.sub === 'string' &&
        Array.isArray(payload.permissions) &&
        payload.permissions.every((permission) => typeof permission === 'string') &&
        typeof payload.exp === 'number'
    );
}

function decodeJson<T>(value: string): T {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}
