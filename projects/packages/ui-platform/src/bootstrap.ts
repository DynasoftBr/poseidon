import type { BootstrapModel, Entity, EntityProperty, PropertyType } from '@poseidon/models';
import {
    createBootstrapEvents,
    ensureBootstrapModel,
    type BootstrapStore,
    type EventPublisher,
} from '@poseidon/runtime';

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
    conversation: { title: 'string', userId: 'reference', messages: 'json' },
};

export function createUIBootstrap(now: Date): BootstrapModel {
    const metadata = { version: 1, createdAt: now, createdById: 'system' };
    const entityProperties: EntityProperty[] = Object.entries(definitions).flatMap(
        ([entityTypeId, fields]) =>
            Object.entries(fields).map(([name, type]) => ({
                ...metadata,
                id: `${entityTypeId}:${name}`,
                entityTypeId: 'entity-property',
                data: {
                    entityTypeId,
                    name,
                    type,
                    ...referenceDefinition(entityTypeId, name),
                    required: !['themeId', 'form', 'bindings', 'publishedReleaseId'].includes(name),
                },
            })),
    );
    return {
        users: [],
        indexes: [],
        entityProperties,
        entityTypes: Object.keys(definitions).map((name) => ({
            ...metadata,
            id: name,
            entityTypeId: 'entity-type',
            data: {
                name,
                ...entityTypeMetadata[name],
                properties: entityProperties
                    .filter((p) => p.data.entityTypeId === name)
                    .map((p) => p.id),
            },
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

export async function bootstrapUI(
    store: BootstrapStore,
    publisher: EventPublisher,
    seeds: Entity[],
): Promise<void> {
    await ensureBootstrapModel(store, publisher, createUIBootstrap(new Date()));
    const events = createBootstrapEvents({
        users: [],
        entityTypes: [],
        entityProperties: [],
        indexes: [],
    });
    for (const entity of seeds) {
        if (await store.hasEntity(entity.id)) continue;
        events.push({
            id: `bootstrap:${entity.id}`,
            type: 'entity-created',
            entityId: entity.id,
            entityTypeId: entity.entityTypeId,
            data: entity.data,
            occurredAt: entity.createdAt,
            actorId: 'system',
        });
    }
    if (events.length) {
        await store.commit(events);
        publisher.publish(events);
    }
}

function referenceDefinition(entityTypeId: string, name: string): Partial<EntityProperty['data']> {
    const references: Record<string, string> = {
        'app:entryComponentId': 'ui-component',
        'app:publishedReleaseId': 'app-release',
        'ui-component:themeId': 'theme',
        'ui-component:dependencies': 'ui-component',
        'app-release:appId': 'app',
        'conversation:userId': 'user',
    };
    const relatedEntityTypeId = references[entityTypeId + ':' + name];
    return relatedEntityTypeId
        ? {
              relatedEntityTypeId,
              ...(name === 'dependencies' ? { itemsType: 'reference' as const } : {}),
          }
        : {};
}
