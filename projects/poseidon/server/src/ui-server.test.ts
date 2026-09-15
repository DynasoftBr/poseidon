import express from 'express';
import request from 'supertest';
import type { AppRelease, Entity, UIBinding } from '@poseidon/models';
import { EntityService, EventPublisher } from '@poseidon/runtime';
import { ReleaseService, UIBuildError } from '@poseidon/ui-platform';
import { configureUI } from './ui-server';
import { handleBinding } from './ui-bindings';
import { createApp } from './app';
import { errorMiddleware } from './error-middleware';

const metadata = {
    _version: 1,
    _createdAt: new Date().toISOString(),
    _createdBy: 'system',
};
function entity(id: string, entityTypeId: string, data: Record<string, unknown>): Entity {
    return { ...metadata, ...data, _id: id, _entityTypeId: entityTypeId };
}
function setup(binding: UIBinding = { kind: 'query', entityTypeId: 'user' }) {
    const store = {
        hasEntity: vi.fn().mockResolvedValue(false),
        findProjection: vi.fn().mockResolvedValue(null),
        commit: vi.fn().mockResolvedValue(undefined),
    };
    const publisher = new EventPublisher();
    const entities = new EntityService(store, publisher);
    const artifacts = {
        read: vi.fn().mockResolvedValue('<html>UI</html>'),
        put: vi.fn().mockResolvedValue('artifact'),
    };
    const releases = new ReleaseService(entities, artifacts, { compile: vi.fn() });
    const release: AppRelease = {
        ...metadata,
        _id: 'release',
        _entityTypeId: 'app-release',
        appId: 'app',
        artifactId: 'artifact',
        diagnostics: [],
        snapshot: {
            app: {
                ...metadata,
                _id: 'app',
                _entityTypeId: 'app',
                name: 'App',
                domain: 'localhost',
                basePath: '/',
                entryComponentId: 'entry',
                publishedReleaseId: 'release',
            },
            themes: [],
            components: [
                {
                    ...metadata,
                    _id: 'entry',
                    _entityTypeId: 'ui-component',
                    name: 'Entry',
                    source: { code: '' },
                    dependencies: [],
                    props: {},
                    events: { run: { type: 'object' } },
                    bindings: { run: binding },
                },
            ],
        },
    };
    const query = vi.spyOn(entities, 'query').mockResolvedValue([]);
    const get = vi.spyOn(entities, 'get').mockResolvedValue(release);
    const create = vi.spyOn(entities, 'create').mockResolvedValue(entity('record', 'user', {}));
    const update = vi.spyOn(entities, 'update').mockResolvedValue(entity('record', 'user', {}));
    const remove = vi.spyOn(entities, 'delete').mockResolvedValue(undefined);
    vi.spyOn(releases, 'resolve').mockResolvedValue(release.snapshot.app);
    const publish = vi.spyOn(releases, 'publish').mockResolvedValue(release);
    const preview = vi.spyOn(releases, 'preview').mockResolvedValue('preview');
    const restore = vi.spyOn(releases, 'restore').mockResolvedValue(undefined);
    const services = { entities, releases, store, publisher, artifacts };
    return { services, release, query, get, create, update, remove, publish, preview, restore };
}
describe('UI bindings', () => {
    it('should reject undeclared events and invalid payloads', async () => {
        const { services, release } = setup();
        await expect(handleBinding(services, release, 'missing', {})).rejects.toThrow('Invalid');
        await expect(handleBinding(services, release, 'run', null as never)).rejects.toThrow(
            'Invalid',
        );
        release.snapshot.components = [];
        await expect(handleBinding(services, release, 'run', {})).rejects.toThrow('Invalid');
    });
    it('should reject unknown persisted binding kinds', async () => {
        const { services, release } = setup({ kind: 'unknown' } as unknown as UIBinding);
        await expect(handleBinding(services, release, 'run', {})).rejects.toThrow('Unsupported');
    });
    it('should query the declared type without entity-specific filtering', async () => {
        const { services, release, query } = setup({ kind: 'query', entityTypeId: 'conversation' });
        const rows: Entity[] = [
            entity('mine', 'conversation', { userId: 'system' }),
            entity('other', 'conversation', { userId: 'other' }),
        ];
        query.mockResolvedValue(rows);
        expect(await handleBinding(services, release, 'run', {})).toEqual(rows);
        release.snapshot.components[0].bindings!.run = {
            kind: 'query',
            entityTypeId: 'user',
        };
        expect(await handleBinding(services, release, 'run', {})).toEqual(rows);
    });
    it.each(['publish', 'preview', 'restore'] as const)(
        'should execute the declared %s operation',
        async (kind) => {
            const context = setup({ kind, appId: 'app' });
            await handleBinding(context.services, context.release, 'run', { releaseId: 'old' });
            expect(context[kind]).toHaveBeenCalled();
        },
    );
    it.each(['create', 'update', 'delete'] as const)(
        'should execute a declared %s with a server actor',
        async (kind) => {
            const context = setup({ kind, entityTypeId: 'user' });
            await handleBinding(context.services, context.release, 'run', {
                id: 'record',
                expectedVersion: 1,
                data: { name: 'Ada' },
            });
            expect(context[kind === 'delete' ? 'remove' : kind]).toHaveBeenCalled();
        },
    );
    it('should mutate conversations without entity-specific authorization', async () => {
        const context = setup({ kind: 'create', entityTypeId: 'conversation' });
        await handleBinding(context.services, context.release, 'run', {
            data: { userId: 'attacker' },
        });
        expect(context.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: { userId: 'attacker' } }),
            'system',
        );
        context.release.snapshot.components[0].bindings!.run = {
            kind: 'update',
            entityTypeId: 'conversation',
        };
        await handleBinding(context.services, context.release, 'run', {
            id: 'record',
            data: {},
            expectedVersion: 1,
        });
        expect(context.update).toHaveBeenCalled();
    });
    it('should reject malformed entity data', async () => {
        const { services, release } = setup({ kind: 'create', entityTypeId: 'user' });
        for (const data of [null, 1, []]) {
            await expect(handleBinding(services, release, 'run', { data })).rejects.toThrow(
                'object',
            );
        }
        release.snapshot.components[0].bindings!.run = {
            kind: 'create',
            entityTypeId: 'ui-component',
        };
        await handleBinding(services, release, 'run', {
            id: 'card',
            data: {
                name: 'Card',
                source: {
                    code: 'type Props = { label: string }; export default function Card(props: Props) { return null; }',
                },
            },
        });
    });
    it('should constrain navigation to the app base path', async () => {
        const { services, release } = setup({ kind: 'navigate' });
        expect(await handleBinding(services, release, 'run', { path: '/chat' })).toEqual({
            navigate: '/chat',
        });
        release.snapshot.app.basePath = '/portal';
        expect(await handleBinding(services, release, 'run', { path: '/chat' })).toEqual({
            navigate: '/portal/chat',
        });
        expect(await handleBinding(services, release, 'run', { path: '/.' })).toEqual({
            navigate: '/portal/',
        });
        for (const path of ['https://other', '//other', '/a?b', '/../other', '/a\\b']) {
            await expect(handleBinding(services, release, 'run', { path })).rejects.toThrow();
        }
    });
    it('should resolve only a published form definition', async () => {
        const { services, release } = setup({ kind: 'submit-form', componentId: 'entry' });
        await expect(handleBinding(services, release, 'run', {})).rejects.toThrow('not found');
        release.snapshot.components[0].form = {
            fields: {},
            derived: {},
            validations: [],
            entities: [],
        };
        expect(await handleBinding(services, release, 'run', {})).toEqual([]);
    });
});
describe('UI HTTP boundary', () => {
    it('should resolve a release and reject unrelated and expired sessions', async () => {
        const { services, release } = setup();
        const app = express();
        app.use(express.json());
        configureUI(app, services);
        app.use(errorMiddleware);
        const resolved = await request(app).get('/api/ui/resolve?path=/chat');
        expect(resolved.status).toBe(200);
        await request(app).get('/api/ui/resolve').set('Host', 'tenant.localhost');
        const body = {
            sessionId: resolved.body.id,
            releaseId: 'release',
            name: 'run',
            payload: {},
        };
        expect((await request(app).post('/api/ui/event').send(body)).status).toBe(200);
        expect(
            (
                await request(app)
                    .post('/api/ui/event')
                    .send({ ...body, releaseId: 'other' })
            ).status,
        ).toBe(500);
        expect(
            (
                await request(app)
                    .post('/api/ui/event')
                    .send({ ...body, sessionId: 'other' })
            ).status,
        ).toBe(500);
        release.snapshot.components[0].bindings!.run = {
            kind: 'restore',
            appId: 'app',
        };
        expect((await request(app).post('/api/ui/event').send(body)).body).toBeNull();
        const now = Date.now();
        const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 9 * 60 * 60 * 1000);
        expect((await request(app).post('/api/ui/event').send(body)).status).toBe(500);
        await request(app).get('/api/ui/resolve');
        clock.mockRestore();
    });
    it('should return source diagnostics when publishing fails', async () => {
        const { services, publish } = setup({ kind: 'publish', appId: 'app' });
        publish.mockRejectedValue(new UIBuildError('entry:4: Type mismatch'));
        const app = express();
        app.use(express.json());
        configureUI(app, services);
        app.use(errorMiddleware);
        const resolved = await request(app).get('/api/ui/resolve');
        const response = await request(app)
            .post('/api/ui/event')
            .send({ sessionId: resolved.body.id, releaseId: 'release', name: 'run', payload: {} });
        expect(response.status).toBe(422);
        expect(response.body.message).toContain('entry:4');
    });
    it('should report missing releases and serve isolated artifacts with CSP', async () => {
        const { services, release } = setup();
        const app = express();
        const renderer = configureUI(app, services);
        app.use(errorMiddleware);
        const page = await request(renderer).get('/artifacts/known');
        expect(page.status).toBe(200);
        expect(page.headers['content-security-policy']).toContain("connect-src 'none'");
        services.artifacts.read.mockRejectedValue(new Error('Missing'));
        expect((await request(renderer).get('/artifacts/missing')).status).toBe(404);
        delete release.snapshot.app.publishedReleaseId;
        expect((await request(app).get('/api/ui/resolve')).status).toBe(500);
    });
    it('should handle releases through the generic entity routes', async () => {
        const { services } = setup();
        const app = createApp({ entityService: services.entities });
        expect(
            (
                await request(app)
                    .patch('/api/v1/entities/app-release/release')
                    .send({ expectedVersion: 1, data: {} })
            ).status,
        ).toBe(200);
        expect(
            (await request(app).post('/api/v1/entities/app-release/query').send({})).status,
        ).toBe(200);
        expect((await request(app).get('/api/v1/entities/app-release/release')).status).toBe(200);
        expect(services.entities.update).toHaveBeenCalled();
    });
});
