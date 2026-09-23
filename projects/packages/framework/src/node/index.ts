import { NodeContextStore } from './context-store';
import { createPoseidon } from '../poseidon';

export * from '../framework';

/**
 * Poseidon API with request-scoped Node.js contexts.
 */
export const poseidon = createPoseidon(new NodeContextStore());
