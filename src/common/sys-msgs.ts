import * as util from "util";
import { SysMsg } from "./";

export const SysMsgs = {
    info: {
        connectedToDatabase: {
            code: 1001,
            message: "Connected to database."
        },
        cannotConnectToDatabase: {
            code: 1002,
            message: "Can't connect to database. trying again in %d seconds..."
        },
        tryingConnectToDatabaseAgain: {
            code: 1003,
            message: "Trying to connect to database again..."
        }
    },
    error: {
        entityTypeNotFound: {
            code: 3001,
            message: "Entity type '%s' not found."
        },
        noEntityTypeSpecified: {
            code: 3002,
            message: "Bad Request. No entity type specified."
        },
        abstractEntityType: {
            code: 3003,
            message: "The entity type '%s' is an abstract entity type, so it cannot be used to directly instantiate a repository."
        },
        invalidHeaderParameters: {
            code: 3004,
            message: "Invalid header parameters. Missing '%s'."
        },
        entityNotFound: {
            code: 3005,
            message: "Cannot find an entity with id '%s' in the entity type collection '%s'"

        },
        databaseLevelError: {
            code: 3005,
            message: "An error at database level ocurred. Error: %s"
        },
        mustHaveIdProperty: {
            code: 3006,
            message: "Must have an id property."
        },
        methodNotAllowed: {
            code: 3007,
            message: "Method not allowed."
        },
        databaseConnectionClosed: {
            code: 3008,
            message: "Database connection closed."
        },
        missingVersionNumber: {
            code: 3009,
            message: "Missing version number."
        }
    },
    validation: {
        validationErrorMsg: {
            code: 4001,
            message: "Some validation problems occurred. See 'validationProblems' for detail about the erros."
        },
        minLength: {
            code: 4002,
            message: "The minumum length allowed for property '%s' is %d."
        },
        maxLength: {
            code: 4003,
            message: "The maximum length allowed for property '%s' is %d."
        },
        maxItems: {
            code: 4004,
            message: "Property '%s' cannot have more them %d item(s)."
        },
        minItems: {
            code: 4005,
            message: "Property '%s' must have at least %d item(s)."
        },
        additionalProperties: {
            code: 4006,
            message: "The property '%s' is not part of this entity type."
        },
        dateFormat: {
            code: 4007,
            message: "Invalid date-time."
        },
        minimum: {
            code: 4008,
            message: "The minimum value for property '%s' is %d."
        },
        maximum: {
            code: 4009,
            message: "The maximum value for property '%s' is %d."
        },
        multipleOf: {
            code: 4010,
            message: "Property '%s' must be multiple of %d."
        },
        pattern: {
            code: 4011,
            message: "Property '%s' doesn't match the pattern '%s'."
        },
        required: {
            code: 4012,
            message: "Property '%s' is missing."
        },
        type: {
            code: 4013,
            message: "Invalid data type. Expected '%s"
        },
        uniqueItems: {
            code: 4014,
            message: "The property '%s' must have unique values. %d and %d are identical."
        },
        enum: {
            code: 4015,
            message: "The value '%s' for property '%s' is not valid."
        },
        linkedEntityDoesNotExist: {
            code: 4016,
            message: "Can't find a entity of type '%s' with the id '%s'."
        },
        divergentLinkedValue: {
            code: 4017,
            message: "The value of '%s' are divergent with the linked entity value. Expected '%s'."
        },
        missingRequiredEntityProperty: {
            code: 4018,
            message: "The system entity '%s' are required for all entity types.\n" +
            "Poseidon adds these properties on entity type's creation. Please don't change it."
        },
        invalidRequiredEntityProperty: {
            code: 4019,
            message: "The system entity '%s' doesn't match the required expecification." +
            "Poseidon adds these properties on entity type's creation. Please don't change it."
        }
    },
    crash: {
        unexpectedError: {
            code: 5001,
            message: "Unexpected error: %s"
        },
        databaseConnectionFailed: {
            code: 5002,
            message: "Database connection failed. Error: %s"
        },

    },
    format: (sysMsg: SysMsg, ...params: any[]): string => {
        return util.format(sysMsg.message, ...params);
    }
};