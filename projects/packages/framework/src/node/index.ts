import { NodeContextStore } from './context-store';
import { configurePoseidon } from '../poseidon';

configurePoseidon(new NodeContextStore());

export * from '../framework';
export { poseidon } from '../poseidon';
