import { MongoClient } from 'mongodb';
import { connectDatabase, disconnectDatabase } from '../src/database';

vi.mock('mongodb', () => ({
    MongoClient: vi.fn(
        class {
            public connect = vi.fn().mockResolvedValue(undefined);
            public close = vi.fn().mockResolvedValue(undefined);
        },
    ),
}));

describe('database lifecycle', () => {
    it('should connect and close the selected client', async () => {
        const client = await connectDatabase('mongodb://example.test/poseidon');
        await disconnectDatabase(client);

        expect(MongoClient).toHaveBeenCalledWith('mongodb://example.test/poseidon');
        expect(client.connect).toHaveBeenCalledOnce();
        expect(client.close).toHaveBeenCalledOnce();
    });

    it('should keep database clients independent', async () => {
        const first = await connectDatabase('mongodb://example.test/first');
        const second = await connectDatabase('mongodb://example.test/second');
        await disconnectDatabase(first);

        expect(first).not.toBe(second);
        expect(second.close).not.toHaveBeenCalled();
        await disconnectDatabase(second);
    });
});
