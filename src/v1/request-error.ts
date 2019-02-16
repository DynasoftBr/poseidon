import { SysMsg, SysError } from "@poseidon/core";

/**
 * A custom Error class
 * @class
 */
export class RequestError extends SysError {
    constructor(sysMsg: SysMsg, ...params: any[]) {
        super("request", sysMsg, ...params);
    }
}