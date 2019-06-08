import { Middleware, Context } from "koa";
import { SysMsgs, SysError } from "../exceptions";
import * as HttpStatus from "http-status-codes";
import { logger } from "../logger";
import { UnexpectedError } from "../exceptions/unexpected-error";


export function unhandledException(): Middleware {
    const { noEntityTypeSpecified, abstractEntityType,
        invalidHeaderParameters, entityNotFound, entityTypeNotFound,
        methodNotAllowed } = SysMsgs.error;

    const { validationErrorMsg } = SysMsgs.validation;

    const errosCodeMap = new Map(
        [
            [noEntityTypeSpecified.code, HttpStatus.BAD_REQUEST],
            [abstractEntityType.code, HttpStatus.BAD_REQUEST],
            [invalidHeaderParameters.code, HttpStatus.BAD_REQUEST],
            [entityNotFound.code, HttpStatus.NOT_FOUND],
            [entityTypeNotFound.code, HttpStatus.NOT_FOUND],
            [validationErrorMsg.code, HttpStatus.UNSUPPORTED_MEDIA_TYPE],
            [methodNotAllowed.code, HttpStatus.METHOD_NOT_ALLOWED],
        ]
    );

    return async (ctx: Context, next) => {

        try {
            await next();
        } catch (error) {
            ctx.status = errosCodeMap.get((error as SysError).code)
                || HttpStatus.INTERNAL_SERVER_ERROR;

            if (ctx.status == HttpStatus.INTERNAL_SERVER_ERROR) {
                logger.error(error.message, error);

                return ctx.body = new UnexpectedError(error);
            }

            ctx.body = error;
        }
    };
}