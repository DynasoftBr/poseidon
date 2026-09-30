import type { ClientSession, MongoClient } from 'mongodb';

/** Owns the MongoDB transaction and session for one runtime request. */
export class RuntimeTransaction {
    private session?: ClientSession;
    private depth = 0;

    /**
     * Creates transaction state for a MongoDB client.
     * @param {MongoClient} client - MongoDB client used to begin sessions.
     */
    public constructor(private readonly client: MongoClient) {}

    /** Begins a transaction, or nests inside the current transaction. */
    public begin(): void {
        if (this.session) {
            this.depth += 1;
            return;
        }
        this.session = this.client.startSession();
        this.session.startTransaction();
        this.depth = 1;
    }

    /** Commits the outermost transaction and releases its session. */
    public async commit(): Promise<void> {
        this.depth -= 1;
        if (this.depth > 0) return;
        try {
            await this.session?.commitTransaction();
        } finally {
            await this.end();
        }
    }

    /** Aborts the active transaction and releases its session. */
    public async abort(): Promise<void> {
        try {
            await this.session?.abortTransaction();
        } finally {
            await this.end();
        }
    }

    /**
     * Returns the active MongoDB session, if a transaction is open.
     * @returns {ClientSession | undefined} Active session, or undefined outside a transaction.
     */
    public currentSession(): ClientSession | undefined {
        return this.session;
    }

    /**
     * Returns MongoDB operation options for the active transaction.
     * @returns {{
     *     session: ClientSession;
     * } | undefined} Session options, or undefined outside a transaction.
     */
    public options(): { session: ClientSession } | undefined {
        return this.session ? { session: this.session } : undefined;
    }

    private async end(): Promise<void> {
        await this.session?.endSession();
        this.session = undefined;
        this.depth = 0;
    }
}
