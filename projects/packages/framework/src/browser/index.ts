import { BrowserContextStore } from './context-store';
import { createPoseidon } from '../poseidon';

export * from '../framework';

/**
 * Poseidon API with one browser session context.
 */
export const poseidon = createPoseidon(new BrowserContextStore());
