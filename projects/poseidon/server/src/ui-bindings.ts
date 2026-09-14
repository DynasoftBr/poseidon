import { randomUUID } from 'node:crypto';
import type { AppRelease, JsonValue, UIBinding } from '@poseidon/models';
import type { EntityService, EntityStore, EventPublisher } from '@poseidon/runtime';
import { prepareComponentData, submitForm, type ReleaseService } from '@poseidon/ui-platform';

export interface BindingServices {
    entities: EntityService;
    store: EntityStore;
    publisher: EventPublisher;
    releases: ReleaseService;
}
const actorId = 'system';
export async function handleBinding(
    services: BindingServices,
    release: AppRelease,
    name: string,
    payload: Record<string, JsonValue>,
): Promise<unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Invalid component event.');
    }
    const component = release.data.snapshot.components.find(
        (record) => record.id === release.data.snapshot.app.data.entryComponentId,
    );
    const binding = component?.data.bindings?.[name];
    if (!binding) {
        throw new Error('Invalid component event.');
    }
    return await executeBinding(services, release, binding, payload);
}
function executeBinding(
    services: BindingServices,
    release: AppRelease,
    binding: UIBinding,
    payload: Record<string, JsonValue>,
): unknown {
    const { entities, store, publisher, releases } = services;
    if (binding.kind === 'navigate') return navigation(release, payload);
    if (binding.kind === 'publish') return releases.publish(binding.appId, actorId);
    if (binding.kind === 'preview') return preview(releases, binding.appId, payload);
    if (binding.kind === 'restore') {
        return releases.restore(binding.appId, String(payload.releaseId), actorId);
    }
    if (binding.kind === 'query') {
        return entities.query({ entityTypeId: binding.entityTypeId });
    }
    if (binding.kind === 'submit-form') {
        const form = release.data.snapshot.components.find(
            (record) => record.id === binding.componentId,
        )?.data.form;
        if (!form) throw new Error('Published form not found.');
        return submitForm(store, publisher, form, { input: payload, actorId });
    }
    if ('entityTypeId' in binding) return mutate(entities, binding, payload);
    throw new Error('Unsupported binding.');
}
async function mutate(
    entities: EntityService,
    binding: Extract<UIBinding, { entityTypeId: string }>,
    payload: Record<string, JsonValue>,
): Promise<unknown> {
    const supplied = payload.data;
    if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) {
        throw new Error('Entity data must be an object.');
    }
    if (binding.kind === 'create') {
        const data = componentData(binding.entityTypeId, {}, supplied);
        return entities.create(
            {
                id: newEntityId(payload.id),
                entityTypeId: binding.entityTypeId,
                data,
            },
            actorId,
        );
    }
    const id = String(payload.id);
    const current = await entities.get(binding.entityTypeId, id);
    const command = {
        id,
        entityTypeId: binding.entityTypeId,
        expectedVersion: Number(payload.expectedVersion),
    };
    if (binding.kind === 'update') {
        const data = componentData(binding.entityTypeId, current.data, supplied);
        return entities.update({ ...command, data }, actorId);
    }
    return entities.delete(command, actorId);
}

function componentData(
    entityTypeId: string,
    current: Record<string, unknown>,
    supplied: Record<string, JsonValue>,
): Record<string, unknown> {
    if (entityTypeId !== 'ui-component') return supplied;
    return prepareComponentData(current, supplied);
}
function navigation(release: AppRelease, payload: Record<string, JsonValue>): { navigate: string } {
    const path = String(payload.path);
    if (!path.startsWith('/') || path.startsWith('//') || /[\\?#]/.test(path)) {
        throw new Error('Invalid route.');
    }
    const base = release.data.snapshot.app.data.basePath;
    const url = new URL((base === '/' ? '' : base) + path, 'http://local');
    if (base !== '/' && url.pathname !== base && !url.pathname.startsWith(`${base}/`)) {
        throw new Error('Route is outside this app.');
    }
    return { navigate: url.pathname };
}

function newEntityId(value: unknown): string {
    return typeof value === 'string' && value ? value : randomUUID();
}

async function preview(
    releases: ReleaseService,
    appId: string,
    payload: Record<string, JsonValue>,
) {
    const props = {
        user: { name: 'Preview' },
        route: '/',
        ...(payload.props as Record<string, JsonValue> | undefined),
    };
    return {
        artifactId: await releases.preview(appId, {
            componentId: payload.componentId as string | undefined,
            themeId: payload.themeId as string | undefined,
            props,
        }),
        props,
    };
}
