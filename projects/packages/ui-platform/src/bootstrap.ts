import type { BootstrapModel, Entity, EntityProperty, PropertyType } from '@poseidon/models';
import { createSystemProperties, ensureBootstrapModel } from '@poseidon/runtime';
import type { DataStorage } from '@poseidon/data-access';

const definitions: Record<string, Record<string, PropertyType>> = {
    app: {
        name: 'string',
        domain: 'string',
        basePath: 'string',
        entryComponentId: 'reference',
        publishedReleaseId: 'reference',
    },
    'ui-component': {
        name: 'string',
        source: 'json',
        props: 'json',
        events: 'json',
        themeId: 'reference',
        bindings: 'json',
        form: 'json',
    },
    theme: { name: 'string', source: 'json' },
    'app-release': {
        appId: 'reference',
        snapshot: 'json',
        artifactId: 'string',
        diagnostics: 'array',
    },
    conversation: { title: 'string', messages: 'json' },
};

export function createUIBootstrap(now: Date): BootstrapModel {
    const context = { systemUserId: 'system', now };
    const metadata = { _version: 1, _createdAt: now.toISOString(), _createdBy: 'system' };
    const entityProperties: EntityProperty[] = Object.entries(definitions).flatMap(
        ([entityTypeId, fields]) => [
            ...createSystemProperties(entityTypeId, context),
            ...Object.entries(fields).map(([name, type]) => ({
                ...metadata,
                _id: `${entityTypeId}:${name}`,
                _entityTypeId: 'entity-property',
                entityTypeId,
                name,
                type,
                ...referenceDefinition(entityTypeId, name),
                required: !['themeId', 'form', 'bindings', 'publishedReleaseId'].includes(name),
            })),
        ],
    );
    return {
        users: [],
        indexes: [],
        entityProperties,
        entityTypes: Object.keys(definitions).map((name) => ({
            ...metadata,
            _id: name,
            _entityTypeId: 'entity-type',
            name,
            ...entityTypeMetadata[name],
            properties: entityProperties.filter((p) => p.entityTypeId === name).map((p) => p._id),
        })),
    };
}

const entityTypeMetadata: Record<
    string,
    { label: string; pluralLabel: string; description: string; menuLocation: string }
> = {
    app: {
        label: 'App',
        pluralLabel: 'Apps',
        description: 'Defines a routable application and its published release.',
        menuLocation: 'Platform',
    },
    'ui-component': {
        label: 'UI component',
        pluralLabel: 'UI components',
        description: 'Defines an authored user interface component.',
        menuLocation: 'Platform',
    },
    theme: {
        label: 'Theme',
        pluralLabel: 'Themes',
        description: 'Defines visual tokens for an application.',
        menuLocation: 'Platform',
    },
    'app-release': {
        label: 'App release',
        pluralLabel: 'App releases',
        description: 'Captures an immutable published application release.',
        menuLocation: 'Platform',
    },
    conversation: {
        label: 'Conversation',
        pluralLabel: 'Conversations',
        description: 'Stores a conversation and its messages.',
        menuLocation: 'Platform',
    },
};

export async function bootstrapUI(storage: DataStorage, seeds: Entity[]): Promise<void> {
    const model = createUIBootstrap(new Date());
    await ensureBootstrapModel(storage, model);
    const namesById = new Map(model.entityTypes.map((type) => [type._id, type.name]));
    for (const entity of seeds) {
        const entityTypeName = namesById.get(entity._entityTypeId);
        if (!entityTypeName) {
            throw new Error(`UI seed '${entity._id}' has no entity type definition.`);
        }
        if (await storage.getById(entityTypeName, entity._id)) continue;
        await storage.create(entityTypeName, entity);
    }
}

function referenceDefinition(entityTypeId: string, name: string): Partial<EntityProperty> {
    const references: Record<string, string> = {
        'app:entryComponentId': 'ui-component',
        'app:publishedReleaseId': 'app-release',
        'ui-component:themeId': 'theme',
        'ui-component:dependencies': 'ui-component',
        'app-release:appId': 'app',
    };
    const relatedEntityTypeId = references[entityTypeId + ':' + name];
    return relatedEntityTypeId
        ? {
              relatedEntityTypeId,
              ...(name === 'dependencies' ? { itemsType: 'reference' as const } : {}),
          }
        : {};
}
