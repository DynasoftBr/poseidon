import type { APIAction } from '@poseidon/models';

export function defaultAction(name: string): APIAction | undefined {
    if (!['create', 'update', 'delete', 'get', 'validate'].includes(name)) return undefined;
    const before =
        name === 'create' || name === 'validate'
            ? ['applyDefaults', 'applyConventions']
            : name === 'update'
              ? ['applyConventions']
              : [];
    return {
        id: name,
        name,
        label: name,
        enabled: true,
        before: before.map((step) => ({
            id: step,
            name: step,
            label: step,
            enabled: true,
            before: [],
        })),
    };
}
