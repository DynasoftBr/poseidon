import type { EntityId } from './entity';
import type { Specification } from './specification';

export interface QueryEntitiesAction {
    entityTypeId: EntityId;
    filter?: Specification;
    limit?: number;
    offset?: number;
}
