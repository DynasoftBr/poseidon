import * as util from "util";

import { SysMsgs, SysError } from "./";
import { ValidateMsg } from "../data/validation/";

/**
 * A custom Error class
 * @class
 */
export class ValidationError extends SysError {
    constructor(public validateErros: ValidationError[], public property?: string) {
        super("validation", SysMsgs.validation..code, SysMsgs.error.validationError.message);
    }

    static objectValidationError(): ValidationError {
        return new ValidationError([], SysMsgs.validation.)
    }

    static invalidDataType(property: string, type: string) {
        return new ValidateMsg(util.format(ValidateMsgs.invalidLinkedPropertyId, property, type),
            property);
    }

    static invalidLinkedPropertyId(property: string, etName: string): ValidateMsg {
        return new ValidateMsg(util.format(ValidateMsgs.invalidLinkedPropertyId, etName, property),
            property);
    }
    static linkedPropertyWithoutId(property: string): ValidateMsg {
        return new ValidateMsg(util.format(ValidateMsgs.invalidLinkedPropertyId, property),
            property);
    }
    static invalidEntityProperty(property: string, etName: string): ValidateMsg {
        return new ValidateMsg(util.format(ValidateMsgs.invalidEntityProperty, property, etName),
            property);
    }
    static required(property: string): ValidateMsg {
        return new ValidateMsg(util.format(ValidateMsgs.requiredProperty, property), property);
    }

    static maxLength(property: string, length: number): ValidateMsg {
        return new ValidateMsg(util.format(ValidateMsgs.maxLength, property, length), property);
    }

    toJSON() {
        return {
            type: this.type,
            code: this.code,
            property: this.property,
            message: this.message,
            errors: this.validateErros
        };
    }
}