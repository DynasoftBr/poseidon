import {
    AccessDeniedError,
    EntityTypeNotFoundError,
    ValidationError,
    poseidonErrorCodes,
} from '../src/poseidon-error';

describe('Poseidon errors', () => {
    it('should retain validation problems', () => {
        const problems = [{ property: 'name', message: 'Name is required.' }];

        const error = new ValidationError(problems);

        expect(error.code).toBe(poseidonErrorCodes.validation);
        expect(error.problems).toEqual(problems);
    });

    it('should identify missing entity types and denied access', () => {
        expect(new EntityTypeNotFoundError('Appointment').code).toBe(
            poseidonErrorCodes.entityTypeNotFound,
        );
        expect(new AccessDeniedError().code).toBe(poseidonErrorCodes.accessDenied);
    });
});
