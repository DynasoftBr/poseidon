import type { EntityData } from '@poseidon/models';

export interface ActionContext {
    input: EntityData;
    outputs: Record<string, unknown>;
}
