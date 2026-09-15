import type { EntityId } from './entity';
import type { Specification } from './specification';

export interface BusinessRule {
    id: EntityId;
    specification: Specification;
    consequence: BusinessRuleConsequence;
}

export type BusinessRuleConsequence =
    | { kind: 'reject'; message: string }
    | { kind: 'set-value'; propertyId: EntityId; value: unknown };
