import { submitForm } from './form-submission';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Entity, EntityEvent, FormDefinition } from '@poseidon/models';
import {
    EntityService,
    EventPublisher,
    createBootstrapModel,
    type EntityStore,
} from '@poseidon/runtime';
import { bootstrapUI, createUIBootstrap } from './bootstrap';
import { createPortalSeeds } from './portal-seed';
import { FileArtifactStore } from './artifact-store';
import { ReleaseService } from './release-service';
import { evaluate, prepareForm, validateValue } from './forms';
import { deriveComponentContract, prepareComponentData } from './component-contract';

class Store implements EntityStore {
    public records = new Map<string, Entity>();
    public commits: EntityEvent[][] = [];
    public fail = false;
    public hasEntity(id: string) {
        return Promise.resolve(this.records.has(id));
    }
    public findProjection(id: string) {
        return Promise.resolve(this.records.get(id) ?? null);
    }
    public findByEntityType(command: { entityTypeId: string }) {
        return Promise.resolve(
            [...this.records.values()].filter(
                (record) => record.entityTypeId === command.entityTypeId,
            ),
        );
    }
    public commit(events: EntityEvent[]) {
        if (this.fail) return Promise.reject(new Error('Conflict'));
        this.commits.push(events);
        for (const event of events) {
            const previous = this.records.get(event.entityId);
            if (
                event.expectedVersion !== undefined &&
                previous?.version !== event.expectedVersion
            ) {
                this.commits.pop();
                return Promise.reject(new Error('Conflict'));
            }
            this.records.set(event.entityId, {
                id: event.entityId,
                entityTypeId: event.entityTypeId,
                data: { ...previous?.data, ...event.data },
                version: (previous?.version ?? 0) + 1,
                createdAt: event.occurredAt,
                createdById: event.actorId,
            });
        }
        return Promise.resolve();
    }
}
async function setup() {
    const store = new Store(),
        publisher = new EventPublisher();
    const core = createBootstrapModel('system', new Date());
    for (const entity of [
        ...core.users,
        ...core.entityTypes,
        ...core.entityProperties,
        ...core.indexes,
    ]) {
        store.records.set(entity.id, entity);
    }
    await bootstrapUI(
        store,
        publisher,
        createPortalSeeds('export default function Portal(){return null}'),
    );
    const service = new EntityService(store, publisher);
    return { store, publisher, service };
}
const compiled = (...componentIds: string[]) => ({ html: '<html/>', componentIds });
describe('UI platform', () => {
    it('should describe every seeded UI entity type', () => {
        const model = createUIBootstrap(new Date());

        for (const entityType of model.entityTypes) {
            expect(entityType.data).toEqual(
                expect.objectContaining({
                    label: expect.any(String),
                    pluralLabel: expect.any(String),
                    description: expect.any(String),
                    menuLocation: 'Platform',
                }),
            );
        }
    });

    it('should derive props and callback events while ignoring supplied metadata', () => {
        const code = `type Props = {
            title: string;
            count?: number;
            onSelect: (value: { id: string }) => void;
        };
        export default function Example(_props: Props){ return null; }`;
        expect(deriveComponentContract(code)).toEqual({
            props: {
                title: { type: 'string', required: true },
                count: { type: 'number', required: false },
            },
            events: {
                onSelect: {
                    type: 'object',
                    properties: { id: { type: 'string', required: true } },
                },
            },
        });
        expect(
            prepareComponentData(
                {},
                {
                    name: 'Example',
                    source: { code },
                    props: { forged: { type: 'string' } },
                    events: { forged: { type: 'object' } },
                    dependencies: ['forged'],
                },
            ),
        ).toMatchObject({
            props: { title: expect.any(Object) },
            events: { onSelect: expect.any(Object) },
        });
    });
    it('should derive contracts from common component declaration styles', () => {
        const arrow = `
            type OwnProps = { active: boolean; tags: string[]; onClose(): void };
            type Props = OwnProps & React.HTMLAttributes<HTMLElement>;
            const Card = (props: Props) => null;
            export default Card;
        `;
        expect(deriveComponentContract(arrow)).toEqual({
            props: {
                active: { type: 'boolean', required: true },
                tags: { type: 'array', items: { type: 'string' }, required: true },
            },
            events: { onClose: { type: 'object' } },
        });
        expect(
            deriveComponentContract(
                'export default (props: { value: null; settings?: { size: number } }) => null',
            ),
        ).toEqual({
            props: {
                value: { type: 'null', required: true },
                settings: {
                    type: 'object',
                    properties: { size: { type: 'number', required: true } },
                    required: false,
                },
            },
            events: {},
        });
    });
    it('should use existing source when updating and require source for creation', () => {
        expect(
            prepareComponentData(
                {
                    source: {
                        code: 'interface Props { label: string } export default function Card(props: Props) { return null }',
                    },
                },
                { name: 'Renamed' },
            ),
        ).toMatchObject({ props: { label: { type: 'string', required: true } } });
        expect(() => prepareComponentData({}, { name: 'Missing source' })).toThrow(
            'requires TypeScript source',
        );
    });
    it('should preserve edited seeds when bootstrap runs again', async () => {
        const { store, publisher, service } = await setup();
        await service.update(
            {
                entityTypeId: 'theme',
                id: 'default-theme',
                expectedVersion: 1,
                data: { name: 'My theme' },
            },
            'system',
        );
        await bootstrapUI(store, publisher, createPortalSeeds('replacement'));
        expect((await service.get('theme', 'default-theme')).data.name).toBe('My theme');
    });
    it('should derive seeded component props and events from TypeScript', () => {
        const source = `export default function Switch(props: {
            label: string;
            checked: boolean;
            onChange: (checked: boolean) => void;
        }) { return null }`;
        const seeded = createPortalSeeds(
            'export default function Portal() { return null }',
            undefined,
            {
                'ui-switch': source,
            },
        ).find((entity) => entity.id === 'ui-switch');
        expect(seeded?.data).toMatchObject({
            props: {
                label: { type: 'string', required: true },
                checked: { type: 'boolean', required: true },
            },
            events: { onChange: { type: 'boolean' } },
        });
    });
    it('should activate only successful releases and restore a prior release', async () => {
        const { service } = await setup();
        const artifacts = { put: vi.fn().mockResolvedValue('asset'), read: vi.fn() };
        const compiler = { compile: vi.fn().mockResolvedValue(compiled('portal-entry')) };
        const releases = new ReleaseService(service, artifacts, compiler);
        const first = await releases.publish('portal', 'system');
        compiler.compile.mockRejectedValueOnce(new Error('Invalid source'));
        await expect(releases.publish('portal', 'system')).rejects.toThrow('Invalid source');
        expect((await service.get('app', 'portal')).data.publishedReleaseId).toBe(first.id);
        const second = await releases.publish('portal', 'system');
        expect(second.id).not.toBe(first.id);
        await releases.restore('portal', first.id, 'system');
        expect((await service.get('app', 'portal')).data.publishedReleaseId).toBe(first.id);
        expect((await releases.resolve('localhost', '/chat')).id).toBe('portal');
        await expect(releases.resolve('other', '/')).rejects.toThrow('No app');
    });
    it('should match published base paths without activating draft URL changes', async () => {
        const { service } = await setup();
        const releases = new ReleaseService(
            service,
            { put: vi.fn().mockResolvedValue('asset'), read: vi.fn() },
            { compile: vi.fn().mockResolvedValue(compiled('portal-entry')) },
        );
        await releases.publish('portal', 'system');
        await service.create(
            {
                id: 'nested-app',
                entityTypeId: 'app',
                data: {
                    name: 'Nested',
                    domain: 'localhost',
                    basePath: '/nested',
                    entryComponentId: 'portal-entry',
                },
            },
            'system',
        );
        expect((await releases.resolve('localhost', '/nested/page')).id).toBe('portal');
        await releases.publish('nested-app', 'system');
        expect((await releases.resolve('localhost', '/nested/page')).id).toBe('nested-app');
        const current = await service.get('app', 'nested-app');
        await service.update(
            {
                id: current.id,
                entityTypeId: 'app',
                expectedVersion: current.version,
                data: { basePath: '/draft' },
            },
            'system',
        );
        expect((await releases.resolve('localhost', '/nested/page')).id).toBe('nested-app');
        expect((await releases.resolve('localhost', '/draft')).id).toBe('portal');
    });
    it('should preview a selected component with inherited or selected themes without changing drafts', async () => {
        const { service } = await setup();
        await service.create(
            {
                id: 'preview-component',
                entityTypeId: 'ui-component',
                data: {
                    name: 'Preview',
                    source: { code: 'export default function Component(){return null}' },
                    props: { name: { type: 'string', required: true } },
                    events: {},
                    bindings: {},
                },
            },
            'system',
        );
        await service.create(
            {
                id: 'alternate',
                entityTypeId: 'theme',
                data: { name: 'Alternate', source: { code: ':scope { color:red; }' } },
            },
            'system',
        );
        const compiler = {
            compile: vi.fn().mockResolvedValue(compiled('preview-component')),
        };
        const releases = new ReleaseService(
            service,
            { put: vi.fn().mockResolvedValue('artifact'), read: vi.fn() },
            compiler,
        );
        await releases.preview('portal', {
            componentId: 'preview-component',
            themeId: 'alternate',
            props: { name: 'Ada' },
        });
        expect(compiler.compile.mock.calls[0][0]).toMatchObject({
            app: { data: { entryComponentId: 'preview-component' } },
        });
        expect(
            compiler.compile.mock.calls[0][0].themes.map((theme: { id: string }) => theme.id),
        ).toContain('alternate');
        expect((await service.get('app', 'portal')).data.entryComponentId).toBe('portal-entry');
        expect(
            (await service.get('ui-component', 'preview-component')).data.themeId,
        ).toBeUndefined();
        await releases.preview('portal', {
            componentId: 'preview-component',
            props: { name: 'Ada' },
        });
        expect(compiler.compile.mock.calls[1][0].themes[0].id).toBe('default-theme');
        await releases.preview('portal');
    });
    it('should snapshot only components discovered by the compiler', async () => {
        const { service } = await setup();
        const releases = new ReleaseService(
            service,
            { put: vi.fn().mockResolvedValue('asset'), read: vi.fn() },
            { compile: vi.fn().mockResolvedValue(compiled('portal-entry')) },
        );
        await service.create(
            {
                id: 'unused',
                entityTypeId: 'ui-component',
                data: {
                    name: 'Unused',
                    source: { code: 'export default function Unused(){return null}' },
                    props: {},
                    events: {},
                    bindings: {},
                },
            },
            'system',
        );
        const release = await releases.publish('portal', 'system');
        expect(release.data.snapshot.components.map((component) => component.id)).toEqual([
            'portal-entry',
        ]);
    });
    it('should store immutable content-addressed artifacts and reject paths', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'poseidon-test-'));
        try {
            const store = new FileArtifactStore(directory);
            const id = await store.put('hello');
            expect(await store.put('hello')).toBe(id);
            expect(await store.read(id)).toBe('hello');
            await expect(store.read('../secret')).rejects.toThrow();
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
const form: FormDefinition = {
    fields: { name: { type: 'string', required: true } },
    derived: {
        title: {
            kind: 'concat',
            values: [
                { kind: 'literal', value: 'Hello ' },
                { kind: 'field', name: 'name' },
            ],
        },
    },
    validations: [],
    entities: [
        {
            entityTypeId: 'conversation',
            id: { kind: 'literal', value: 'first' },
            values: {
                title: { kind: 'field', name: 'title' },
                userId: { kind: 'literal', value: 'system' },
                messages: { kind: 'literal', value: [] },
            },
        },
        {
            entityTypeId: 'conversation',
            id: { kind: 'literal', value: 'second' },
            values: {
                title: { kind: 'field', name: 'title' },
                userId: { kind: 'literal', value: 'system' },
                messages: { kind: 'literal', value: [] },
            },
        },
    ],
};
describe('forms', () => {
    it('should resolve a reference to a later target in the same atomic form', async () => {
        const { store, publisher } = await setup();
        const metadata = { version: 1, createdAt: new Date(), createdById: 'system' };
        store.records.set('pair', {
            ...metadata,
            id: 'pair',
            entityTypeId: 'entity-type',
            data: { properties: ['pair:other'] },
        });
        store.records.set('pair:other', {
            ...metadata,
            id: 'pair:other',
            entityTypeId: 'entity-property',
            data: {
                entityTypeId: 'pair',
                name: 'other',
                type: 'reference',
                relatedEntityTypeId: 'pair',
            },
        });
        const definition: FormDefinition = {
            fields: {},
            derived: {},
            validations: [],
            entities: [
                {
                    entityTypeId: 'pair',
                    id: { kind: 'literal', value: 'left' },
                    values: { other: { kind: 'literal', value: 'right' } },
                },
                {
                    entityTypeId: 'pair',
                    id: { kind: 'literal', value: 'right' },
                    values: { other: { kind: 'literal', value: 'left' } },
                },
            ],
        };
        const result = await submitForm(store, publisher, definition, {
            input: {},
            actorId: 'system',
        });
        expect(result).toHaveLength(2);
        expect(store.records.get('left')?.data.other).toBe('right');
    });
    it('should calculate hidden required values and commit all targets together', async () => {
        const { store, publisher } = await setup();
        store.commits = [];
        const result = await submitForm(store, publisher, form, {
            input: { name: 'Ada' },
            actorId: 'system',
        });
        expect(result.map((entity) => entity.data.title)).toEqual(['Hello Ada', 'Hello Ada']);
        expect(store.commits).toHaveLength(1);
        expect(store.commits[0]).toHaveLength(2);
    });
    it('should update an existing target and reject a stale version without writes', async () => {
        const { store, publisher } = await setup();
        await submitForm(store, publisher, form, { input: { name: 'Ada' }, actorId: 'system' });
        const update = structuredClone(form);
        update.entities.forEach(
            (target) => (target.expectedVersion = { kind: 'literal', value: 1 }),
        );
        const result = await submitForm(store, publisher, update, {
            input: { name: 'Grace' },
            actorId: 'system',
        });
        expect(result[0].version).toBe(2);
        store.commits = [];
        await expect(
            submitForm(store, publisher, update, { input: { name: 'Ada' }, actorId: 'system' }),
        ).rejects.toThrow();
        expect(store.commits).toHaveLength(0);
    });
    it('should reject duplicate IDs and invalid expected versions', async () => {
        const { store, publisher } = await setup();
        const invalid = structuredClone(form);
        invalid.entities[1].id = invalid.entities[0].id;
        await expect(
            submitForm(store, publisher, invalid, { input: { name: 'Ada' }, actorId: 'system' }),
        ).rejects.toThrow('distinct');
        invalid.entities.pop();
        invalid.entities[0].expectedVersion = { kind: 'literal', value: 'bad' };
        await expect(
            submitForm(store, publisher, invalid, { input: { name: 'Ada' }, actorId: 'system' }),
        ).rejects.toThrow('version');
    });
    it('should map entity type errors back to input fields', async () => {
        const { store, publisher } = await setup();
        const invalid = structuredClone(form);
        invalid.fields.name = { type: 'number', required: true };
        invalid.entities[0].values.title = { kind: 'field', name: 'name' };
        await expect(
            submitForm(store, publisher, invalid, { input: { name: 7 }, actorId: 'system' }),
        ).rejects.toMatchObject({ problems: [{ property: 'name', message: expect.any(String) }] });
    });
    it('should commit nothing when a later target is invalid', async () => {
        const { store, publisher } = await setup();
        store.commits = [];
        const invalid = structuredClone(form);
        invalid.entities[1].values = {};
        await expect(
            submitForm(store, publisher, invalid, { input: { name: 'Ada' }, actorId: 'system' }),
        ).rejects.toThrow();
        expect(store.commits).toHaveLength(0);
        expect(await store.hasEntity('first')).toBe(false);
    });
    it('should publish nothing when the transaction conflicts', async () => {
        const { store, publisher } = await setup();
        const listener = vi.fn();
        publisher.subscribe('entity-created', listener);
        store.fail = true;
        await expect(
            submitForm(store, publisher, form, { input: { name: 'Ada' }, actorId: 'system' }),
        ).rejects.toThrow('Conflict');
        expect(listener).not.toHaveBeenCalled();
    });
    it('should validate inputs separately from mapped entity values', () => {
        expect(() => prepareForm(form, {})).toThrow();
        expect(prepareForm(form, { name: 'Ada' }).title).toBe('Hello Ada');
        expect(
            validateValue({ a: 2 }, { type: 'object', properties: { a: { type: 'number' } } }),
        ).toBe(true);
        expect(validateValue([null], { type: 'array', items: { type: 'null' } })).toBe(true);
        expect(validateValue(Infinity, { type: 'number' })).toBe(false);
    });
    it('should evaluate declarative arithmetic and reject invalid operands', () => {
        expect(
            evaluate(
                {
                    kind: 'multiply',
                    values: [
                        { kind: 'literal', value: 2 },
                        { kind: 'literal', value: 3 },
                    ],
                },
                {},
            ),
        ).toBe(6);
        expect(() =>
            evaluate(
                {
                    kind: 'divide',
                    values: [
                        { kind: 'literal', value: 1 },
                        { kind: 'literal', value: 0 },
                    ],
                },
                {},
            ),
        ).toThrow();
        expect(() =>
            evaluate({ kind: 'add', values: [{ kind: 'literal', value: 'x' }] }, {}),
        ).toThrow();
    });
});
