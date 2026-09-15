import type { EntityId } from './entity';
import type { BusinessRule } from './business-rule';

export interface EntityCommandBase {
    id: EntityId;
    name: string;
    label: string;
    enabled: boolean;
    timeoutMs?: number | null;
    before: EntityCommand[];
    after: EntityCommand[];
    inputPropertyIds?: EntityId[];
    rules?: BusinessRule[];
}

export type EntityCommand = EntityCommandBase &
    (
        | { operation: 'script'; scriptId: EntityId }
        | { operation: 'create' | 'update' | 'delete' | 'business-rules'; scriptId?: never }
    );

export const entityCommandOperations = [
    'create',
    'update',
    'delete',
    'script',
    'business-rules',
] as const;
export type EntityCommandOperation = (typeof entityCommandOperations)[number];
