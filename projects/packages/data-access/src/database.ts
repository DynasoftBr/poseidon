import mongoose, { type Connection } from 'mongoose';

export async function connectDatabase(uri: string): Promise<Connection> {
    await mongoose.connect(uri);

    return mongoose.connection;
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
}
