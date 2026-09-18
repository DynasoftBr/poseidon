import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { SystemUser } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';

export interface AuthenticatedRequest extends Request {
    user?: SystemUser | null;
}

export interface AuthMiddleware {
    authenticate: RequestHandler;
    revokeUserId(userId: string): void;
}

export function createAuthMiddleware(
    users: Pick<DataStorage, 'get'>,
    secret?: string,
    localDevelopment = false,
): AuthMiddleware {
    const revokedUserIds = new Set<string>();

    async function getUser(id: string): Promise<SystemUser | null> {
        try {
            return (await users.get('user', id)) as SystemUser;
        } catch {
            return null;
        }
    }

    async function resolveUser(header: string | undefined): Promise<SystemUser | null> {
        if (!header && localDevelopment) return await getUser('system');

        const match = /^Bearer ([^\s]+)$/.exec(header ?? '');
        if (!match || !secret) return null;

        let decoded: string | jwt.JwtPayload;
        try {
            decoded = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
        } catch {
            return null;
        }

        if (typeof decoded === 'string' || typeof decoded.userId !== 'string') return null;
        if (revokedUserIds.has(decoded.userId)) return null;

        return await getUser(decoded.userId);
    }

    const authenticate: RequestHandler = async (request, _response, next) => {
        (request as AuthenticatedRequest).user = await resolveUser(request.headers.authorization);
        next();
    };

    return {
        authenticate,
        revokeUserId: (userId: string) => revokedUserIds.add(userId),
    };
}
