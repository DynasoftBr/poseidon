import type { DevelopmentToken, EntityTypeDefinition } from '@poseidon/framework';
import type { Runtime } from '../runtime';

export type RuntimeOperationContext = {
    runtime: Runtime;
    entityType: EntityTypeDefinition;
    input: Record<string, unknown>;
    outputs: Record<string, unknown>;
    token?: DevelopmentToken;
};
