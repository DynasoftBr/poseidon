import 'dotenv/config';
import {
    connectDatabase,
    MongoEventProjectionStore,
    MongoIndexManager,
} from '@poseidon/data-access';
import {
    createBootstrapModel,
    ensureBootstrapModel,
    EntityService,
    EventPublisher,
} from '@poseidon/runtime';
import { getLogger } from '@poseidon/service-utils';
import { createApp } from './app';

const logger = getLogger('poseidon-server');

async function start(): Promise<void> {
    const databaseUri = process.env.MONGODB_URI;

    if (!databaseUri) {
        throw new Error('MONGODB_URI must be configured.');
    }

    const client = await connectDatabase(databaseUri);
    const store = new MongoEventProjectionStore(client);
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
        store,
        publisher,
        createBootstrapModel('system', new Date()),
    );
    await indexManager.reconcile();
    const port = Number(process.env.PORT ?? 3000);
    const app = createApp({
        entityService: new EntityService(store, publisher),
    });

    app.listen(port, () => {
        logger.info({ initialized, port }, 'Poseidon server listening');
    });
}

void start().catch((error: unknown) => {
    logger.fatal({ error }, 'Poseidon server failed to start');
    process.exitCode = 1;
});
