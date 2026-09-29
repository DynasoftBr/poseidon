export type OperationKind = 'action' | 'query';

export function operationAddress(
    kind: OperationKind,
    entityType: string,
    operation: string,
): string {
    return `${kind}:${entityType}:${operation}`;
}

export function parseOperationAddress(value: string): {
    kind: OperationKind;
    entityType: string;
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
