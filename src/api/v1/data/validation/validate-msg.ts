import * as util from "util";

const ValidateMsgs = {
    invalidEntityProperty: "The property '%s' is not valid for entity type '%s'.",
    requiredProperty: "The property '%s' is required.",
    maxLength: "The maximum character allowed to property '%s' is %d.",
    linkedPropertyWithoutId: "The linked property '%s' does not have an '_id' field.",
    invalidLinkedPropertyId: "Can't find an entity of type '%s' with the id '%s'.",
    invalidDataType: "Property '%s' has an invalid data type, was expected '%s'."
};

export class ValidateMsg {
    constructor(public message: string, public property: string) {
    }

    
}