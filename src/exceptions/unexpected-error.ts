import { SysError } from "./sys-error";
import { SysMsgs } from "./sys-msgs";
import { env } from "../env.config";

export class UnexpectedError extends SysError {


    public stack: string;

    constructor(error: Error) {
        super("unexpected", SysMsgs.error.unexpectedError, error.message);
    }

    toJSON() {
        const { type, code, message, stack } = this;
        return {
            type,
            code,
            message,
            stack: !env.isProd ? stack : undefined
        };
    }
}