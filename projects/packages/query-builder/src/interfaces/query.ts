import type { ConditionExpression } from '@poseidon/utilities';
import type { QueryAggregate, HavingConditionGroup, IncludedKeys } from './utility-types';

/**
 * Declarative query options passed to an execution resolver.
 * @template T - Entity or value shape represented by this declaration.
 */
export interface Query<T> {
    /** Whether to recursively include related entities. */
    $recursive?: boolean;
    /** Whether the included relationship must be present. */
    $required?: boolean;
    /** {@link ConditionExpression} used to filter candidate entities. */
    $where?: ConditionExpression<T>;
    /** {@link IncludedKeys} mapping related properties to their nested queries. */
    $include?: IncludedKeys<T>;
    /** {@link QueryAggregate} projections keyed by output name. */
    $aggregate?: QueryAggregate;
    /** {@link HavingConditionGroup} applied to aggregate values. */
    $having?: HavingConditionGroup<T>;
    /** Names of properties to return. */
    $select?: string[];
    /** Number of results to skip. */
    $skip?: number;
    /** Maximum number of results to return. */
    $take?: number;
    /** Whether to request only the first result. */
    $first?: boolean;
    /** Whether the resolver should omit result tracking. */
    $noTrack?: boolean;
}
