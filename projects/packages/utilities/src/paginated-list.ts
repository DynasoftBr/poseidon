export interface PaginatedList<T> extends AsyncIterable<T> {
    readonly items: readonly T[];
    next(): Promise<PaginatedList<T> | null>;
}
