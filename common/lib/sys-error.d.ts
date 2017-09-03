import { SysMsg } from "./sys-msg";
/**
 * A custom Error class
 * @class
 */
export declare class SysError extends Error {
    type: string;
    code: number;
    /**
     * Contruscts the SysError class.
     * @param type The type of the error.
     * @param sysMsg The SysMsg object.
     * @param params Params to be formated into the message string.
     */
    constructor(type: string, sysMsg: SysMsg, ...params: any[]);
    toJSON(): {
        type: string;
        code: number;
        message: string;
    };
    /**
     * Returns a new SysError class for 'Unexpected Error' error.
     * @func
     * @static
     * @param aditionalMsg: A complement for the default message.
     */
    static unexpectedError(aditionalMsg: string): SysError;
}
