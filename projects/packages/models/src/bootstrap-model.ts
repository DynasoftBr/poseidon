import type { EntityProperty } from './entity-types/entity-property';
import type { EntityType } from './entity-types/entity-type';
import type { IndexDefinition } from './entity-types/index-definition';
import type { SystemUser } from './entity-types/system-user';
import type { Script } from './entity-types/script';

export interface BootstrapModel {
    users: SystemUser[];
    entityTypes: EntityType[];
    entityProperties: EntityProperty[];
    indexes: IndexDefinition[];
    scripts: Script[];
}
