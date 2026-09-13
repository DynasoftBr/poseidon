import type { ErrorRequestHandler } from 'express';
import { PoseidonError, poseidonErrorCodes } from '@poseidon/runtime';
import { getLogger } from '@poseidon/service-utils';

const logger = getLogger('poseidon-server');

const statusByErrorCode = {
    [poseidonErrorCodes.validation]: 422,
    [poseidonErrorCodes.entityTypeNotFound]: 404,
    [poseidonErrorCodes.entityAlreadyExists]: 409,
    [poseidonErrorCodes.entityVersionConflict]: 409,
    [poseidonErrorCodes.accessDenied]: 403,
} as const;

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof PoseidonError) {
        const status = statusByErrorCode[error.code];

        response.status(status).json({
            error: {
                code: error.code,
                message: error.message,
                problems: error.problems,
            },
        });

        return;
    }

    logger.error({ error }, 'Unexpected request failure');
    response
        .status(500)
        .json({ error: { code: 'unexpected-error', message: 'Unexpected error.' } });
};
