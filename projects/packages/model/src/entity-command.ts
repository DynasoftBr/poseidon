import type { EntityId } from './entity';
import type { Specification } from './specification';

/** A declarative mutation supported by an EntityType. */
export interface EntityCommand {
    id: EntityId;
    name: string;
    label: string;
    operation: EntityCommandOperation;
    inputPropertyIds?: EntityId[];
    rules?: EntityRule[];
}

export const entityCommandOperations = ['create', 'update', 'delete'] as const;
export type EntityCommandOperation = (typeof entityCommandOperations)[number];

export interface EntityRule {
    id: EntityId;
    specification: Specification;
    consequence: RuleConsequence;
}

export type RuleConsequence =
    | { kind: 'reject'; message: string }
    | { kind: 'set-value'; propertyId: EntityId; value: unknown };
