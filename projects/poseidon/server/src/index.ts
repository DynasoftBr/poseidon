import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
    bootstrapUI,
    createPortalSeeds,
    FileArtifactStore,
    ContainerCompiler,
    ReleaseService,
} from '@poseidon/ui-platform';
import { configureUI } from './ui-server';
import { errorMiddleware } from './error-middleware';
import 'dotenv/config';
import {
    connectDatabase,
    MongoEventProjectionStore,
    MongoDataStorage,
    MongoIndexManager,
    MongoCollectionMigration,
} from '@poseidon/data-access';
import {
    createBootstrapModel,
    ensureBootstrapModel,
    EntityService,
    EventPublisher,
} from '@poseidon/runtime';
import { getLogger } from '@poseidon/service-utils';
import { createApp } from './app';
import { createAuthMiddleware } from './auth-middleware';

const logger = getLogger('poseidon-server');

async function start(): Promise<void> {
    const databaseUri = process.env.MONGODB_URI;

    if (!databaseUri) {
        throw new Error('MONGODB_URI must be configured.');
    }

    const client = await connectDatabase(databaseUri);
    await new MongoCollectionMigration(client).migrate();
    const store = new MongoEventProjectionStore(client);
    const storage = new MongoDataStorage(client);
    const publisher = new EventPublisher();
    const indexManager = new MongoIndexManager(client);
    publisher.subscribe('entity-created', (event) => {
        if (event.entityTypeId === 'index') {
            void indexManager.apply(event.data).catch((error: unknown) => {
                logger.error(
                    { error, indexId: event.entityId },
                    'Poseidon index realization failed',
                );
            });
        }
    });
    const initialized = await ensureBootstrapModel(
        storage,
        createBootstrapModel('system', new Date()),
    );
    await indexManager.reconcile();
    const port = Number(process.env.PORT ?? 3000);
    const entities = new EntityService(store, publisher);
    const app = createApp({
        entityService: entities,
        auth: createAuthMiddleware(
            entities,
            process.env.JWT_SECRET,
            process.env.POSEIDON_LOCAL_UI === 'true' && process.env.NODE_ENV !== 'production',
        ),
    });
    await initializeUI({ entities, store, storage, publisher, app });

    app.listen(port, '127.0.0.1', () => {
        logger.info({ initialized, port }, 'Poseidon server listening');
    });
}

void start().catch((error: unknown) => {
    logger.fatal(error, 'Poseidon server failed to start');
    process.exitCode = 1;
});

async function initializeUI({
    entities,
    store,
    storage,
    publisher,
    app,
}: {
    entities: EntityService;
    store: MongoEventProjectionStore;
    storage: MongoDataStorage;
    publisher: EventPublisher;
    app: ReturnType<typeof createApp>;
}): Promise<void> {
    if (process.env.POSEIDON_LOCAL_UI === 'true') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Local UI identity is unavailable in production.');
        }
        const artifacts = new FileArtifactStore(
            resolve(process.env.POSEIDON_ARTIFACT_DIRECTORY ?? '.poseidon-artifacts'),
        );
        const source = await readFile(resolve(__dirname, '../../portal/entry.tsx'), 'utf8');
        const componentSources = await initialComponents();
        const portalSeeds = createPortalSeeds(
            source,
            await readFile(resolve(__dirname, '../../portal/source-editor.tsx'), 'utf8'),
            componentSources,
        );
        await bootstrapUI(storage, portalSeeds);
        await migrateLegacyPrimitiveSources(entities, componentSources);
        const releases = new ReleaseService(entities, artifacts, new ContainerCompiler());
        const portal = await entities.get('app', 'portal');
        if (!portal.publishedReleaseId) {
            await releases.publish('portal', 'system');
        }
        configureUI(
            app,
            { entities, releases, artifacts, store, publisher },
            {
                rendererOrigin: process.env.POSEIDON_RENDERER_ORIGIN,
                clientOrigin: process.env.POSEIDON_CLIENT_ORIGIN,
            },
        ).listen(Number(process.env.POSEIDON_RENDERER_PORT ?? 3001), '127.0.0.1');
        app.use(errorMiddleware);
    }
}

async function initialComponents(): Promise<Record<string, string>> {
    const formField = (
        await readFile(
            resolve(__dirname, '../../../packages/ui-foundation/src/form-field.tsx'),
            'utf8',
        )
    ).replace("from './form'", "from '@components/ui-form'");
    return {
        ...(await primitiveSources()),
        'entity-type-editor': await readFile(
            resolve(__dirname, '../../portal/entity-type-editor.tsx'),
            'utf8',
        ),
        'identity-editor': await readFile(
            resolve(__dirname, '../../portal/identity-editor.tsx'),
            'utf8',
        ),
        'portal-home': await readFile(resolve(__dirname, '../../portal/home.tsx'), 'utf8'),
        'portal-chat': await readFile(resolve(__dirname, '../../portal/chat.tsx'), 'utf8'),
        'triton-page': await readFile(resolve(__dirname, '../../portal/triton-page.tsx'), 'utf8'),
        'portal-header': await readFile(resolve(__dirname, '../../portal/header.tsx'), 'utf8'),
        'portal-sidebar': await readFile(resolve(__dirname, '../../portal/sidebar.tsx'), 'utf8'),
        'resource-editor-page': await readFile(
            resolve(__dirname, '../../portal/resource-editor-page.tsx'),
            'utf8',
        ),
        'visual-editor': await readFile(
            resolve(__dirname, '../../portal/visual-editor.tsx'),
            'utf8',
        ),
        'portal-records': await readFile(resolve(__dirname, '../../portal/records.tsx'), 'utf8'),
        'portal-composer': await readFile(resolve(__dirname, '../../portal/composer.tsx'), 'utf8'),
        'ui-form-field': formField + '\nexport default FormField;',
        'ui-form-step': formField + '\nexport default FormStep;',
        'ui-form':
            (await readFile(
                resolve(__dirname, '../../../packages/ui-foundation/src/form.tsx'),
                'utf8',
            )) + '\nexport default Form;',
    };
}

async function primitiveSources(): Promise<Record<string, string>> {
    const files = {
        'ui-button': 'button',
        'ui-card': 'card',
        'ui-badge': 'badge',
        'ui-input': 'input',
        'ui-field': 'field',
        'ui-switch': 'switch',
        'ui-table': 'table',
        'ui-themescope': 'theme-scope',
        'ui-select': 'select',
        'ui-dialog': 'dialog',
        'ui-feedback': 'feedback',
        'ui-panel': 'panel',
        'ui-typography': 'typography',
        'ui-icon': 'icon',
    };
    return Object.fromEntries(
        await Promise.all(
            Object.entries(files).map(async ([id, file]) => [
                id,
                await readFile(resolve(__dirname, `../../portal/components/${file}.tsx`), 'utf8'),
            ]),
        ),
    );
}

async function migrateLegacyPrimitiveSources(
    entities: EntityService,
    sources: Record<string, string>,
): Promise<void> {
    for (const [id, code] of Object.entries(sources)) {
        if (!id.startsWith('ui-') || ['ui-form', 'ui-form-field', 'ui-form-step'].includes(id)) {
            continue;
        }
        const component = await entities.get('ui-component', id);
        const current = component.source as { code?: string } | undefined;
        if (
            component._version === 1 &&
            current?.code?.includes('export function Button') &&
            current.code.includes('export function Icon')
        ) {
            await entities.update(
                {
                    id,
                    entityTypeId: 'ui-component',
                    expectedVersion: component._version,
                    data: { source: { code } },
                },
                'system',
            );
        }
    }
}
