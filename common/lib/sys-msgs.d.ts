import { SysMsg } from "./";
export declare const SysMsgs: {
    info: {
        connectedToDatabase: {
            code: number;
            message: string;
        };
        cannotConnectToDatabase: {
            code: number;
            message: string;
        };
        tryingConnectToDatabaseAgain: {
            code: number;
            message: string;
        };
    };
    error: {
        entityTypeNotFound: {
            code: number;
            message: string;
        };
        noEntityTypeSpecified: {
            code: number;
            message: string;
        };
        abstractEntityType: {
            code: number;
            message: string;
        };
        invalidHeaderParameters: {
            code: number;
            message: string;
        };
        entityNotFound: {
            code: number;
            message: string;
        };
        databaseLevelError: {
            code: number;
            message: string;
        };
        mustHaveIdProperty: {
            code: number;
            message: string;
        };
        methodNotAllowed: {
            code: number;
            message: string;
        };
        databaseConnectionClosed: {
            code: number;
            message: string;
        };
    };
    validation: {
        validationErrorMsg: {
            code: number;
            message: string;
        };
        minLength: {
            code: number;
            message: string;
        };
        maxLength: {
            code: number;
            message: string;
        };
        maxItems: {
            code: number;
            message: string;
        };
        minItems: {
            code: number;
            message: string;
        };
        additionalProperties: {
            code: number;
            message: string;
        };
        dateFormat: {
            code: number;
            message: string;
        };
        minimum: {
            code: number;
            message: string;
        };
        maximum: {
            code: number;
            message: string;
        };
        multipleOf: {
            code: number;
            message: string;
        };
        pattern: {
            code: number;
            message: string;
        };
        required: {
            code: number;
            message: string;
        };
        type: {
            code: number;
            message: string;
        };
        uniqueItems: {
            code: number;
            message: string;
        };
        enum: {
            code: number;
            message: string;
        };
        linkedEntityDoesNotExist: {
            code: number;
            message: string;
        };
        divergentLinkedValue: {
            code: number;
            message: string;
        };
        missingRequiredEntityProperty: {
            code: number;
            message: string;
        };
        invalidRequiredEntityProperty: {
            code: number;
            message: string;
        };
    };
    crash: {
        unexpectedError: {
            code: number;
            message: string;
        };
        databaseConnectionFailed: {
            code: number;
            message: string;
        };
    };
    format: (sysMsg: SysMsg, ...params: any[]) => string;
};
