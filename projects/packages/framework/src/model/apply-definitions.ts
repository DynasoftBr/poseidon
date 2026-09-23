import type { PoseidonContext } from '../context/poseidon-context';
import type { EntityTypeDefinition } from './entity-type-definition';

/**
 * Applies declared definitions through one EntityType action.
 * @param {PoseidonContext} context - Context used for the action.
 * @param {EntityTypeDefinition[]} definitions - Definitions to apply.
 * @returns {Promise<void>} Resolves when the action finishes.
 * @throws If the action fails.
 * @internal
 */
export async function applyDefinitions(
    context: PoseidonContext,
    definitions: EntityTypeDefinition[],
): Promise<void> {
    if (definitions.length === 0) return;

    await context.execute({
        entityType: 'entity-type',
        action: 'applyDefinitions',
        payload: { definitions },
    });
}
