import * as util from "util";

import { SysMsgs, SysError } from "./";

/**
 * A custom Error class
 * @class
 */
export class RequestError extends SysError {
    constructor(code: number, message: string) {
        super("request", code, message);
    }

    /**
     * Returns a new RequestError class for 'Entity Not Found' error.
     * @func
     * @static
     * @param etName: Entity type name.
     */
    static entityNotFound(id: string, etName: string) {
        return new RequestError(SysMsgs.error.entityNotFound.code,
            util.format(SysMsgs.error.entityNotFound.message, id, etName));
    }

    /**
     * Returns a new RequestError class for 'Entity Type Not Found' error.
     * @func
     * @static
     * @param etName: Entity type name.
     */
    static entityTypeNotFound(etName: string): RequestError {
        return new RequestError(SysMsgs.error.entityTypeNotFound.code,
            util.format(SysMsgs.error.entityTypeNotFound.message, etName));
    }

    /**
     * Returns a new RequestError class for 'No Entity Type Specified' error.
     * @func
     * @static
     */
    static noEntityTypeSpecified(): RequestError {
        return new RequestError(SysMsgs.error.noEntityTypeSpecified.code, SysMsgs.error.noEntityTypeSpecified.message);
    }

    /**
     * Returns a new RequestError class for 'Abstract Entity Type' error.
     * @func
     * @static
     * @param etName: Entity type name.
     */
    static abstractEntityType(etName: string): RequestError {
        return new RequestError(SysMsgs.error.abstractEntityType.code,
            util.format(SysMsgs.error.abstractEntityType.message, etName));
    }

    /**
     * Returns a new RequestError class for 'Invalid Header Parameters' error.
     * @func
     * @static
     * @param aditionalMsg: A complement for the default message.
     */
    static invalidHeaderParameters(aditionalMsg: string): RequestError {
        return new RequestError(SysMsgs.error.invalidHeaderParameters.code,
            util.format(SysMsgs.error.invalidHeaderParameters.message, aditionalMsg));
    }

}