import { PoseidonOperation } from './poseidon-operation';

/**
 * Action declaration embedded in an entity type or another action.
 * @extends {Structure}
 */
export class PoseidonAction extends PoseidonOperation {
    /**
     * Actions that run in order before this action.
     */
    before!: PoseidonAction[];
}
