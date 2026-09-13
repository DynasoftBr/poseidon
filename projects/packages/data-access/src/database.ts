import { MongoClient } from 'mongodb';

export async function connectDatabase(uri: string): Promise<MongoClient> {
    const client = new MongoClient(uri);
    await client.connect();
    return client;
}

export async function disconnectDatabase(client: MongoClient): Promise<void> {
    await client.close();
}
