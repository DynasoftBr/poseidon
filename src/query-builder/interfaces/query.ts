import { ConditionGroup, QueryAggregate, HavingConditionGroup, IncludedKeys } from "./utility-types";

export interface Query<T> {
  $recursive?: boolean;
  $required?: boolean;
  $where?: ConditionGroup<T>;
  $include?: IncludedKeys<T>;
  $aggregate?: QueryAggregate;
  $having?: HavingConditionGroup<T>;
  $select?: string[];
  $skip?: number;
  $take?: number;
  $first?: boolean;
  $noTrack?: boolean;
}
