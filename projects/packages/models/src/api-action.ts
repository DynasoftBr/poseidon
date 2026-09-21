import type { EntityId } from './entity';

export interface APIAction {
    id: EntityId;
    name: string;
    label: string;
    enabled: boolean;
    before: APIAction[];
}
