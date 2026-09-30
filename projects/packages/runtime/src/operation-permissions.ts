import {
    operationAddress,
    parseOperationAddress,
    type ActionDefinition,
    type EntityTypeDefinition,
    type OperationReference,
    type QueryDefinition,
} from '@poseidon/framework';
import { EntityNotFoundError } from './poseidon-error';

type DeclaredOperation = ActionDefinition | QueryDefinition;
type EntityTypeLoader = (name: string) => Promise<EntityTypeDefinition | null>;

/**
 * Resolves every permission declared by an operation, including nested permissions.
 * @param {string} address - Readable address of the operation.
 * @param {EntityTypeLoader} loadEntityType - Callback that loads an {@link EntityTypeDefinition} by name.
 * @returns {Promise<string[]>} Promise resolving to all required operation addresses.
 */
export async function resolveAllOperationPermissions(
    address: string,
    loadEntityType: EntityTypeLoader,
): Promise<string[]> {
    const addresses = new Set<string>();
    await collectOperationPermissions(
        await resolveOperationForAddress(address, loadEntityType),
        addresses,
        new Set<string>(),
    );
    return [...addresses];

    async function collectOperationPermissions(
        operation: DeclaredOperation,
        results: Set<string>,
        visited: Set<string>,
    ): Promise<void> {
        if (visited.has(operation._id)) return;
        visited.add(operation._id);
        for (const reference of operation.permissions) {
            const resolved = await resolveOperationForReference(reference, loadEntityType);
            results.add(resolved.address);
            await collectOperationPermissions(resolved.operation, results, visited);
        }
    }
}

async function resolveOperationForAddress(
    address: string,
    loadEntityType: EntityTypeLoader,
): Promise<DeclaredOperation> {
    const parsed = parseOperationAddress(address);
    if (!parsed) throw new Error(`Operation '${address}' does not exist.`);
    const entityType = await loadEntityType(parsed.entityType);
    const operations = parsed.kind === 'action' ? entityType?.actions : entityType?.queries;
    const operation = operations?.find((candidate) => candidate.name === parsed.operation);
    if (!operation) throw new Error(`Operation '${address}' does not exist.`);
    return operation;
}

async function resolveOperationForReference(
    reference: OperationReference,
    loadEntityType: EntityTypeLoader,
): Promise<{ address: string; operation: DeclaredOperation }> {
    const entityType = await loadEntityType(reference.entityTypeId);
    if (!entityType) throw new EntityNotFoundError(reference.entityTypeId);
    const action = entityType.actions?.find((candidate) => candidate._id === reference.operationId);
    if (action) {
        return {
            address: operationAddress('action', entityType.name, action.name),
            operation: action,
        };
    }
    const query = entityType.queries?.find((candidate) => candidate._id === reference.operationId);
    if (query) {
        return {
            address: operationAddress('query', entityType.name, query.name),
            operation: query,
        };
    }
    throw new EntityNotFoundError(reference.operationId);
}
