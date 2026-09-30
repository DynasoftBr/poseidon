/** Distinguishes an Action address from a Query address. */
export type OperationKind = 'action' | 'query';

/**
 * Builds the readable address of an Action or Query.
 * @param {OperationKind} kind - {@link OperationKind}.
 * @param {string} entityType - Name of the entity type.
 * @param {string} operation - Declared operation name.
 * @returns {string} Colon-separated operation address.
 */
export function operationAddress(
    kind: OperationKind,
    entityType: string,
    operation: string,
): string {
    return `${kind}:${entityType}:${operation}`;
}

/**
 * Splits an operation address into its kind, entity type, and operation name.
 * @param {string} value - Colon-separated operation address to parse.
 * @returns {{
 *     kind: OperationKind;
 *     entityType: string;
 *     operation: string;
 * } | null} Parsed address with its {@link OperationKind}, entity type, and operation name, or null when invalid.
 */
export function parseOperationAddress(value: string): {
    /** {@link OperationKind} identifying whether this is an Action or Query. */
    kind: OperationKind;
    /** Name of the addressed entity type. */
    entityType: string;
    /** Name of the addressed operation. */
    operation: string;
} | null {
    const [kind, entityType, operation, extra] = value.split(':');
    if (
        (kind !== 'action' && kind !== 'query') ||
        !entityType ||
        !operation ||
        extra !== undefined
    ) {
        return null;
    }
    return { kind, entityType, operation };
}
