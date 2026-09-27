import { BrowserContextStore } from './context-store';
import { configurePoseidon } from '../poseidon';

configurePoseidon(new BrowserContextStore());

export * from '../framework';
export { poseidon } from '../poseidon';
