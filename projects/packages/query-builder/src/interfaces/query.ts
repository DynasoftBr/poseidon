import type { ConditionExpression } from '@poseidon/utilities';
import type { QueryAggregate, HavingConditionGroup, IncludedKeys } from './utility-types';

export interface Query<T> {
    $recursive?: boolean;
    $required?: boolean;
    $where?: ConditionExpression<T>;
    $include?: IncludedKeys<T>;
    $aggregate?: QueryAggregate;
    $having?: HavingConditionGroup<T>;
    $select?: string[];
    $skip?: number;
    $take?: number;
    $first?: boolean;
    $noTrack?: boolean;
}
