import { addMandatoryProperties } from '../system-actions/entity-type/add-mandatory-properties';
import type { SystemActionDefinition } from '../system-actions/types';
import { systemEntityTypes } from './entity-types';

const addMandatoryPropertiesAction = {
    id: 'addMandatoryProperties',
    name: 'addMandatoryProperties',
    label: 'Add Mandatory Properties',
    enabled: true,
    system: true,
    operation: 'script',
    scriptId: 'addMandatoryProperties',
    before: [],
    after: [],
    code: addMandatoryProperties,
} satisfies SystemActionDefinition;

export const system = {
    entityTypes: {
        ...systemEntityTypes,
        entityType: {
            ...systemEntityTypes.entityType,
            actions: {
                addMandatoryProperties: addMandatoryPropertiesAction,
            },
        },
    },
} as const;

export { systemEntityTypes, systemEntityTypeNames } from './entity-types';
export type { EntityForTypeName, SystemEntityTypeDefinition } from './entity-types';
