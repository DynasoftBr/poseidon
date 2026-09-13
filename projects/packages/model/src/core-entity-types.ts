import type { EntityType } from './entity-type';

export const coreEntityTypeNames = [
    'entity-type',
    'entity-property',
    'index',
    'user',
    'relation-link',
] as const;

export type CoreEntityTypeName = (typeof coreEntityTypeNames)[number];

export function isCoreEntityType(entityType: EntityType): boolean {
    return coreEntityTypeNames.some((name) => name === entityType.name);
}
