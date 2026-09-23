import type { EntityProperty } from '@poseidon/framework';
import type { ActionContext } from './action-context';

export function applyDefaults(
    { input }: ActionContext,
    properties: EntityProperty[],
): Promise<null> {
    for (const property of properties) {
        if (input[property.name] === undefined && property.default !== undefined) {
            input[property.name] = resolveDefault(property.default);
        }
    }
    return Promise.resolve(null);
}

export function applyConventions(
    { input }: ActionContext,
    properties: EntityProperty[],
): Promise<null> {
    for (const property of properties) {
        const value = input[property.name];
        if (typeof value === 'string' && property.convention) {
            input[property.name] = applyConvention(value, property.convention);
        }
    }
    return Promise.resolve(null);
}

function resolveDefault(value: unknown): unknown {
    return value === '[[NOW]]' ? new Date().toISOString() : value;
}

function applyConvention(value: string, convention: EntityProperty['convention']): string {
    if (convention === 'lower-case') return value.toLowerCase();
    if (convention === 'upper-case') return value.toUpperCase();
    if (convention === 'capitalize-first-letter') {
        return value.replace(
            /\w\S*/g,
            (word) => word[0].toUpperCase() + word.slice(1).toLowerCase(),
        );
    }
    return value;
}
