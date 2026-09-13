import type { EntityProperty } from './entity-property';
import type { EntityType } from './entity-type';
import type { IndexDefinition } from './index-definition';
import type { SystemUser } from './system-user';

export interface BootstrapModel {
    users: SystemUser[];
    entityTypes: EntityType[];
    entityProperties: EntityProperty[];
    indexes: IndexDefinition[];
}
