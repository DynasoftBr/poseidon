import type { EntityType } from './entity-types/entity-type';

export const coreEntityTypeNames = [
    'entity-type',
    'entity-property',
    'index',
    'user',
    'identity',
    'relation-link',
] as const;

export type CoreEntityTypeName = (typeof coreEntityTypeNames)[number];

export function isCoreEntityType(entityType: EntityType): boolean {
    return coreEntityTypeNames.some((name) => name === entityType.name);
}
