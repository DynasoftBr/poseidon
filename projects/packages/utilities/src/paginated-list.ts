/**
 * One page of results with access to subsequent pages and asynchronous iteration.
 * @template T - Entity or value shape represented by this declaration.
 */
export interface PaginatedList<T> extends AsyncIterable<T> {
    /** Results available in the current page. */
    readonly items: readonly T[];
    /**
     * Loads the next page, returning null when no further page exists.
     * @returns {Promise<PaginatedList<T> | null>} Promise resolving to the {@link PaginatedList}, or null at the end.
     */
    next(): Promise<PaginatedList<T> | null>;
}
