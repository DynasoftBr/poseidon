import type { EntityId } from './entity';
import type { BusinessRule } from './business-rule';

export interface APIActionBase {
    id: EntityId;
    name: string;
    label: string;
    enabled: boolean;
    system?: boolean;
    timeoutMs?: number | null;
    before: APIAction[];
    after: APIAction[];
    inputPropertyIds?: EntityId[];
    rules?: BusinessRule[];
}

export type APIAction = APIActionBase &
    (
        | { operation: 'script'; scriptId: EntityId }
        | { operation: 'create' | 'update' | 'delete' | 'business-rules'; scriptId?: never }
    );

export const apiActionOperations = [
    'create',
    'update',
    'delete',
    'script',
    'business-rules',
] as const;
export type APIActionOperation = (typeof apiActionOperations)[number];
