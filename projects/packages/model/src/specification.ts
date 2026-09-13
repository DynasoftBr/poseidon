import type { EntityId } from './entity';

export type Specification =
    | {
          kind: 'comparison';
          propertyId: EntityId;
          operator: ComparisonOperator;
          value: string | number | boolean | null;
      }
    | { kind: 'and'; conditions: Specification[] }
    | { kind: 'or'; conditions: Specification[] }
    | { kind: 'not'; condition: Specification };

export const comparisonOperators = [
    'equals',
    'not-equals',
    'greater-than',
    'less-than',
    'contains',
    'exists',
] as const;
export type ComparisonOperator = (typeof comparisonOperators)[number];
