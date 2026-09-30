import type { DevelopmentToken } from '@poseidon/framework';

/** Mutable input, prior outputs, and authenticated claims for an Action. */
export interface ActionContext {
    /** Mutable input supplied to the operation. */
    input: Record<string, unknown>;
    /** Prior operation results keyed by operation ID. */
    outputs: Record<string, unknown>;
    /** Verified {@link DevelopmentToken} claims available to the operation. */
    token?: DevelopmentToken;
}
