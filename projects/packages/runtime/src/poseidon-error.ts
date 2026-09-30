export const poseidonErrorCodes = {
    validation: 'validation',
    entityTypeNotFound: 'entity-type-not-found',
    entityNotFound: 'entity-not-found',
    entityAlreadyExists: 'entity-already-exists',
    accessDenied: 'access-denied',
} as const;

/** Stable codes identifying runtime failures. */
export type PoseidonErrorCode = (typeof poseidonErrorCodes)[keyof typeof poseidonErrorCodes];

/** Validation failure associated with a property. */
export interface ValidationProblem {
    /** Property associated with the validation failure. */
    property: string;
    /** Human-readable explanation of the failure. */
    message: string;
}

/**
 * Runtime failure with a stable code and optional validation details.
 * @extends {Error}
 */
export class PoseidonError extends Error {
    /**
     * Creates the error with its identifying details.
     * @param {PoseidonErrorCode} code - {@link PoseidonErrorCode} identifying the failure.
     * @param {string} message - Human-readable failure description.
     * @param {ValidationProblem[]} problems - {@link ValidationProblem} associated with the error.
     */
    public constructor(
        public readonly code: PoseidonErrorCode,
        message: string,
        public readonly problems: ValidationProblem[] = [],
    ) {
        super(message);
        this.name = 'PoseidonError';
    }
}

/**
 * Failure caused by invalid entity data.
 * @extends {PoseidonError}
 */
export class ValidationError extends PoseidonError {
    /**
     * Creates the error with its identifying details.
     * @param {ValidationProblem[]} problems - {@link ValidationProblem} associated with the error.
     */
    public constructor(problems: ValidationProblem[]) {
        super(poseidonErrorCodes.validation, 'The entity is invalid.', problems);
        this.name = 'ValidationError';
    }
}

/**
 * Failure caused by a missing entity type.
 * @extends {PoseidonError}
 */
export class EntityTypeNotFoundError extends PoseidonError {
    /**
     * Creates the error with its identifying details.
     * @param {string} entityTypeName - Name of the entity collection.
     */
    public constructor(entityTypeName: string) {
        super(
            poseidonErrorCodes.entityTypeNotFound,
            `Entity type '${entityTypeName}' was not found.`,
        );
        this.name = 'EntityTypeNotFoundError';
    }
}

/**
 * Failure caused by a missing entity record.
 * @extends {PoseidonError}
 */
export class EntityNotFoundError extends PoseidonError {
    /**
     * Creates the error with its identifying details.
     * @param {string} entityId - Identifier of the affected entity.
     */
    public constructor(entityId: string) {
        super(poseidonErrorCodes.entityNotFound, `Entity '${entityId}' was not found.`);
        this.name = 'EntityNotFoundError';
    }
}

/**
 * Failure caused by an entity ID that is already stored.
 * @extends {PoseidonError}
 */
export class EntityAlreadyExistsError extends PoseidonError {
    /**
     * Creates the error with its identifying details.
     * @param {string} entityId - Identifier of the affected entity.
     */
    public constructor(entityId: string) {
        super(poseidonErrorCodes.entityAlreadyExists, `Entity '${entityId}' already exists.`);
        this.name = 'EntityAlreadyExistsError';
    }
}

/**
 * Failure caused by insufficient authorization.
 * @extends {PoseidonError}
 */
export class AccessDeniedError extends PoseidonError {
    /**
     * Creates the error with its identifying details.
     */
    public constructor() {
        super(poseidonErrorCodes.accessDenied, 'Access is denied.');
        this.name = 'AccessDeniedError';
    }
}
