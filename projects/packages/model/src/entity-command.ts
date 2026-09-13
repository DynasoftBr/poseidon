import type { EntityId } from './entity';

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

export type Specification =
    | { kind: 'comparison'; propertyId: EntityId; operator: ComparisonOperator; value: unknown }
    | { kind: 'and'; conditions: Specification[] }
    | { kind: 'or'; conditions: Specification[] }
    | { kind: 'not'; condition: Specification };

export const comparisonOperators = [
    'equals',
    'not-equals',
    'greater-than',
    'less-than',
    'contains',
] as const;
export type ComparisonOperator = (typeof comparisonOperators)[number];

export type RuleConsequence =
    | { kind: 'reject'; message: string }
    | { kind: 'set-value'; propertyId: EntityId; value: unknown };
