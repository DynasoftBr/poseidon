import type { Entity } from '../entity';
import type { EntityProperty } from './entity-property';
import type { APIAction } from '../api-action';

export interface EntityType extends Entity, EntityTypeData {}

export type EntityTypeData = {
    name: string;
    label: string;
    structure?: boolean;
    properties: EntityProperty[];
    actions?: APIAction[];
};
