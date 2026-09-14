import type { Entity } from '@poseidon/models';
import { deriveComponentContract } from './component-contract';

function entity(id: string, entityTypeId: string, data: Record<string, unknown>): Entity {
    return { id, entityTypeId, data, version: 1, createdAt: new Date(), createdById: 'system' };
}
function component(id: string, name: string, code: string): Entity {
    return entity(id, 'ui-component', {
        name,
        source: { code },
        ...deriveComponentContract(code),
        bindings: {},
    });
}
function authoring() {
    const resources: Record<string, string> = {
        components: 'ui-component',
        themes: 'theme',
        entities: 'entity-type',
        users: 'user',
        properties: 'entity-property',
    };
    return {
        events: Object.fromEntries(
            Object.keys(resources).flatMap((key) =>
                [key, 'create' + key, 'update' + key].map((name) => [name, { type: 'object' }]),
            ),
        ),
        bindings: Object.fromEntries(
            Object.entries(resources).flatMap(([name, entityTypeId]) => [
                [name, { kind: 'query', entityTypeId }],
                ['create' + name, { kind: 'create', entityTypeId }],
                ['update' + name, { kind: 'update', entityTypeId }],
            ]),
        ),
    };
}
function entry(source: string): Entity {
    const editing = authoring();
    return entity('portal-entry', 'ui-component', {
        name: 'Portal',
        source: { code: source },
        themeId: 'default-theme',
        props: { user: { type: 'object' }, route: { type: 'string' } },
        events: {
            ...editing.events,
            publish: { type: 'object' },
            preview: { type: 'object' },
            restore: {
                type: 'object',
                properties: { releaseId: { type: 'string', required: true } },
            },
            releases: { type: 'object' },
            navigate: { type: 'object', properties: { path: { type: 'string', required: true } } },
            conversations: { type: 'object' },
            createConversation: { type: 'object' },
            updateConversation: { type: 'object' },
        },
        bindings: {
            ...editing.bindings,
            publish: { kind: 'publish', appId: 'portal' },
            preview: { kind: 'preview', appId: 'portal' },
            restore: { kind: 'restore', appId: 'portal' },
            releases: { kind: 'query', entityTypeId: 'app-release' },
            navigate: { kind: 'navigate' },
            conversations: { kind: 'query', entityTypeId: 'conversation' },
            createConversation: { kind: 'create', entityTypeId: 'conversation' },
            updateConversation: { kind: 'update', entityTypeId: 'conversation' },
        },
    });
}
export function createPortalSeeds(
    source: string,
    sourceEditorSource?: string,
    additions: Record<string, string> = {},
): Entity[] {
    return [
        ...(sourceEditorSource
            ? [component('source-editor', 'SourceEditor', sourceEditorSource)]
            : []),
        entity('default-theme', 'theme', {
            name: 'Default',
            source: {
                code: ':scope{--canvas:#fafafa;--surface:#fff;--ink:#18181b;--primary:#6366f1;--primary-hover:#4f46e5;--danger:#dc2626;--accent:#4f46e5;--muted:#71717a;--line:#e4e4e7;--selected:#eef2ff} :scope:has([data-mode="dark"]){--canvas:#18181b;--surface:#242428;--ink:#fafafa;--muted:#a1a1aa;--line:#3f3f46;--selected:#312e81;--accent:#a5b4fc;--danger:#f87171}',
            },
        }),
        entry(source),
        ...Object.entries(additions).map(([id, code]) => component(id, id, code)),
        entity('portal', 'app', {
            name: 'Poseidon Portal',
            domain: 'localhost',
            basePath: '/',
            entryComponentId: 'portal-entry',
        }),
    ];
}
