import type { DevelopmentToken, EntityTypeDefinition } from '@poseidon/framework';
import type { Runtime } from '../runtime';

/** {@link Runtime} services and invocation state supplied to an operation. */
export type RuntimeOperationContext = {
    /** {@link Runtime} services available to the operation. */
    runtime: Runtime;
    /** {@link EntityTypeDefinition} targeted by the invocation. */
    entityType: EntityTypeDefinition;
    /** Mutable input supplied to the operation. */
    input: Record<string, unknown>;
    /** Prior operation results keyed by operation ID. */
    outputs: Record<string, unknown>;
    /** Verified {@link DevelopmentToken} claims available to the operation. */
    token?: DevelopmentToken;
};
