import 'dotenv/config';
import { PoseidonContext } from '@poseidon/framework';
import { Runtime } from '@poseidon/runtime';
import { getLogger } from '@poseidon/service-utils';
import { MongoClient } from 'mongodb';
import { createApp } from './app';

const logger = getLogger('poseidon-server');

async function start(): Promise<void> {
    const databaseUri = process.env.MONGODB_URI;

    if (!databaseUri) {
        throw new Error('MONGODB_URI must be configured.');
    }

    const client = new MongoClient(databaseUri);
    await client.connect();
    const port = Number(process.env.PORT ?? 3000);
    const app = createApp({
        createContext: () => new PoseidonContext(new Runtime(client), () => undefined),
    });

    app.listen(port, '127.0.0.1', () => {
        logger.info({ port }, 'Poseidon server listening');
    });
}

void start().catch((error: unknown) => {
    logger.fatal(error, 'Poseidon server failed to start');
    process.exitCode = 1;
});
