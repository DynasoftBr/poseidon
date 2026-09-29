import type { DevelopmentToken } from '@poseidon/framework';

export interface ActionContext {
    input: Record<string, unknown>;
    outputs: Record<string, unknown>;
    token?: DevelopmentToken;
}
