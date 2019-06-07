import { Middleware, Context } from "koa";

export function unhandledException(): Middleware {
    return async (ctx: Context, next) => {

        try {
            await next();
        } catch (error) {
            // if (error.code === SysMsgs.error.noEntityTypeSpecified.code
            //     || error.code === SysMsgs.error.abstractEntityType.code
            //     || error.code === SysMsgs.error.invalidHeaderParameters.code) {

            //     ctx.status = HttpStatus.BAD_REQUEST;
            //     ctx.body = error;
            // }
            // else if (error.code === SysMsgs.error.entityNotFound.code
            //     || error.code === SysMsgs.error.entityTypeNotFound.code)

            //     res.status(404).send(error);
            // else if (error.code === SysMsgs.validation.validationErrorMsg.code)
            //     res.status(422).send(error);
            // else if (error.code === SysMsgs.error.methodNotAllowed.code)
            //     res.status(405).send(error);
            // else {
            //     res.status(500).send();
            //     winston.error(error.message, error);
            // }
        }
    };
}