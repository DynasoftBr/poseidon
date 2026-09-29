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

export async function authorizeRuntimeRequest({
    entityType,
    operation,
    token,
}: {
    entityType: EntityTypeDefinition;
    operation: DeclaredOperation;
    request: PoseidonRequest;
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
