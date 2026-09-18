import 'dotenv/config';
import { connectDatabase, MongoDataStorage } from '@poseidon/data-access';
import { createBootstrapModel, ensureBootstrapModel, RuntimeContext } from '@poseidon/runtime';
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
    const storage = new MongoDataStorage(client);
    const initialized = await ensureBootstrapModel(
        storage,
        createBootstrapModel('system', new Date()),
    );
    const port = Number(process.env.PORT ?? 3000);
    const app = createApp({
        createContext: (actor) => new RuntimeContext(new MongoDataStorage(client), actor),
        auth: createAuthMiddleware(
            storage,
            process.env.JWT_SECRET,
            process.env.POSEIDON_LOCAL_DEVELOPMENT === 'true' &&
                process.env.NODE_ENV !== 'production',
        ),
    });

    app.listen(port, '127.0.0.1', () => {
        logger.info({ initialized, port }, 'Poseidon server listening');
    });
}

void start().catch((error: unknown) => {
    logger.fatal(error, 'Poseidon server failed to start');
    process.exitCode = 1;
});
