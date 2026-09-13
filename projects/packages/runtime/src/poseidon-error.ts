export const poseidonErrorCodes = {
    validation: 'validation',
    entityTypeNotFound: 'entity-type-not-found',
    entityNotFound: 'entity-not-found',
    entityAlreadyExists: 'entity-already-exists',
    entityVersionConflict: 'entity-version-conflict',
    accessDenied: 'access-denied',
} as const;

export type PoseidonErrorCode = (typeof poseidonErrorCodes)[keyof typeof poseidonErrorCodes];

export interface ValidationProblem {
    property: string;
    message: string;
}

export class PoseidonError extends Error {
    public constructor(
        public readonly code: PoseidonErrorCode,
        message: string,
        public readonly problems: ValidationProblem[] = [],
    ) {
        super(message);
        this.name = 'PoseidonError';
    }
}

export class ValidationError extends PoseidonError {
    public constructor(problems: ValidationProblem[]) {
        super(poseidonErrorCodes.validation, 'The entity is invalid.', problems);
        this.name = 'ValidationError';
    }
}

export class EntityTypeNotFoundError extends PoseidonError {
    public constructor(entityTypeName: string) {
        super(
            poseidonErrorCodes.entityTypeNotFound,
            `Entity type '${entityTypeName}' was not found.`,
        );
        this.name = 'EntityTypeNotFoundError';
    }
}

export class EntityNotFoundError extends PoseidonError {
    public constructor(entityId: string) {
        super(poseidonErrorCodes.entityNotFound, `Entity '${entityId}' was not found.`);
        this.name = 'EntityNotFoundError';
    }
}

export class EntityAlreadyExistsError extends PoseidonError {
    public constructor(entityId: string) {
        super(poseidonErrorCodes.entityAlreadyExists, `Entity '${entityId}' already exists.`);
        this.name = 'EntityAlreadyExistsError';
    }
}

export class EntityVersionConflictError extends PoseidonError {
    public constructor(entityId: string) {
        super(
            poseidonErrorCodes.entityVersionConflict,
            `Entity '${entityId}' was changed by another operation.`,
        );
        this.name = 'EntityVersionConflictError';
    }
}

export class AccessDeniedError extends PoseidonError {
    public constructor() {
        super(poseidonErrorCodes.accessDenied, 'Access is denied.');
        this.name = 'AccessDeniedError';
    }
}
