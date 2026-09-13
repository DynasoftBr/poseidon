import type { EntityId } from './entity';
import type { EntityProperty } from './entity-property';
import type { EntityCommand } from './entity-command';

export interface CreateEntityTypeCommand {
    id: EntityId;
    name: string;
    label: string;
    abstract?: boolean;
    superTypeId?: EntityId;
    commands?: EntityCommand[];
    properties: CreateEntityPropertyCommand[];
}

export type CreateEntityPropertyCommand = Omit<
    EntityProperty,
    'createdAt' | 'createdById' | 'entityTypeId'
>;
