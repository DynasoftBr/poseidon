import {
    operationAddress,
    verifyDevelopmentToken,
    type ActionDefinition,
    type DevelopmentToken,
    type EntityTypeDefinition,
    type PoseidonRequest,
    type QueryDefinition,
} from '@poseidon/framework';

type DeclaredOperation = ActionDefinition | QueryDefinition;

/**
 * Verifies a supplied token and checks its permission for the requested operation.
 * @param {{
 *     entityType: EntityTypeDefinition;
 *     operation: DeclaredOperation;
 *     request: PoseidonRequest;
 *     token: string | undefined;
 * }} context - Target {@link EntityTypeDefinition}, {@link DeclaredOperation}, and authorization token.
 * @returns {Promise<DevelopmentToken | undefined>} {@link DevelopmentToken}, or undefined for an internal request without a token.
 * @throws {@link Error} — If the token is invalid or does not authorize the operation.
 */
export async function authorizeRuntimeRequest({
    entityType,
    operation,
    token,
}: {
    /** {@link EntityTypeDefinition} targeted by the invocation. */
    entityType: EntityTypeDefinition;
    /** {@link DeclaredOperation} being authorized. */
    operation: DeclaredOperation;
    /** External {@link PoseidonRequest} being authorized. */
    request: PoseidonRequest;
    /** Signed token supplied by the caller. */
    token: string | undefined;
}): Promise<DevelopmentToken | undefined> {
    if (token === undefined) return undefined;
    const authenticated = await verifyDevelopmentToken(token);
    if (entityType.name === 'identity' && operation.name === 'authorize') {
        if (authenticated.kind !== 'user') {
            throw new Error('Operation authorization requires a user token.');
        }
        return authenticated;
    }

    const target = addressOf(entityType, operation);
    if (!authenticated.permissions.includes(target)) {
        throw new Error(`Operation '${target}' is not authorized.`);
    }
    return authenticated;
}

function addressOf(entityType: EntityTypeDefinition, operation: DeclaredOperation): string {
    const kind = entityType.actions?.some((candidate) => candidate._id === operation._id)
        ? 'action'
        : 'query';
    return operationAddress(kind, entityType.name, operation.name);
}
