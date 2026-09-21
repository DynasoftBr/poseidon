import { systemEntityTypes } from './entity-types';

export const system = { entityTypes: systemEntityTypes } as const;

export { systemEntityTypes, systemEntityTypeNames } from './entity-types';
export type { EntityForTypeName, SystemEntityTypeDefinition } from './entity-types';
