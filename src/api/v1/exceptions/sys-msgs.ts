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
            message: "Some validation problems occurred."
        },
        entityTypeNotFound: {
            code: 4002,
            message: "Some validation problems occurred."
        },
        invalidEntityProperty: {
            code: 4003,
            message: "The property '%s' is not valid for entity type '%s'."
        },
        requiredProperty: {
            code: 4004,
            message: "The property '%s' is required."
        },
        maxLength: {
            code: 4005,
            message: "The maximum character allowed to property '%s' is %d."
        },
        linkedPropertyWithoutId: {
            code: 4006,
            message: "The linked property '%s' does not have an '_id' field."
        },
        invalidLinkedPropertyId: {
            code: 4007,
            message: "Can't find an entity of type '%s' with the id '%s'."
        },
        invalidDataType: {
            code: 4008,
            message: "Property '%s' has an invalid data type, was expected '%s'."
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