import {
    Entity,
    EntityTypeDef,
    HttpPoseidonTransport,
    PoseidonContext,
    Property,
    poseidon,
} from '@poseidon/framework';
import { Runtime } from '@poseidon/runtime';
import type { MongoClient } from 'mongodb';
import { createServer, type Server } from 'node:http';
import { createApp } from '../src/app';

@EntityTypeDef()
class Customer extends Entity {
    @Property({ type: 'string', required: true })
    name!: string;
}

class MemoryMongo {
    readonly data = new Map<string, Map<string, Record<string, unknown>>>();

    client(): MongoClient {
        return {
            db: () => ({
                collection: <T extends Record<string, unknown>>(name: string) => ({
                    findOne: (filter: Record<string, unknown>) =>
                        (this.records(name).get(String(filter._id ?? filter.name)) ??
                            null) as T | null,
                    insertOne: (value: T) => {
                        this.records(name).set(String(value._id), { ...value });
                    },
                    replaceOne: (filter: Record<string, unknown>, value: T) => {
                        const records = this.records(name);
                        const id = String(filter._id);
                        const matchedCount = records.has(id) ? 1 : 0;
                        if (matchedCount) records.set(id, { ...value });
                        return { matchedCount };
                    },
                    deleteOne: (filter: Record<string, unknown>) => ({
                        deletedCount: this.records(name).delete(String(filter._id)) ? 1 : 0,
                    }),
                }),
            }),
            startSession: () => ({
                startTransaction() {},
                commitTransaction: () => Promise.resolve(undefined),
                abortTransaction: () => Promise.resolve(undefined),
                endSession: () => Promise.resolve(undefined),
            }),
        } as unknown as MongoClient;
    }

    records(name: string): Map<string, Record<string, unknown>> {
        const records = this.data.get(name) ?? new Map<string, Record<string, unknown>>();
        this.data.set(name, records);
        return records;
    }
}

function listen(server: Server): Promise<void> {
    return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
}

function close(server: Server): Promise<void> {
    return new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
    );
}

describe('model registration', () => {
    it('should persist client model definitions through the server runtime', async () => {
        const memory = new MemoryMongo();
        const runtime = new Runtime(memory.client());
        const server = createServer(
            createApp({
                createContext: () => new PoseidonContext(runtime, () => undefined),
            }),
        );
        await listen(server);
        const { port } = server.address() as { port: number };

        try {
            poseidon.initialize({
                context: new PoseidonContext(
                    new HttpPoseidonTransport(`http://127.0.0.1:${port}`),
                    () => undefined,
                ),
            });

            await poseidon.model().entity(Customer).apply();

            expect(memory.records('entity-type').get('customer')).toMatchObject({
                _id: 'customer',
                name: 'customer',
                label: 'Customer',
                properties: [{ name: 'name', type: 'string', required: true }],
            });
        } finally {
            await close(server);
        }
    });
});
