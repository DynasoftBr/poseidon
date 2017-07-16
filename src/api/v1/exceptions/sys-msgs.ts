import * as util from "util";

export const SysMsgs = {
    info: {
        connectedToDatabase: {
            code: 1001,
            message: "Connected to database."
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
            message: "Invalid header parameters. %s"
        },
        entityNotFound: {
            code: 3005,
            message: "Cannot find an entity with id '%s' in the entity type collection '%s'"

        },
        databaseLevelError: {
            code: 3005,
            message: "An error at database level ocurred. Error: %s"
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
            message: "Property '%s' doesn't match de pattern '%s'."
        },
        required: {
            code: 4012,
            message: "Property '%s' is missing."
        },
        type:{
            code: 4013,
            message: "Invalid data type. Expected '%s"
        },
        uniqueItems: {
            code: 4014,
            message: "The property '%s' must have unique values. %d and %d are duplicate."
        },
        enum: {
            code: 4015,
            message: "The value '%s' for property '%s' is not valid."
        },
        linkedEntityDoesNotExist: {
            code: 4009,
            message: "Can't find a entity of type %s with the id %d specifyed in property %s."
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

    }
};