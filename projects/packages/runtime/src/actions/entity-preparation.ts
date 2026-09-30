import type { EntityPropertyDefinition } from '@poseidon/framework';
import type { ActionContext } from './action-context';

/**
 * Populates missing input fields with their declared default values.
 * @param {ActionContext} context - {@link ActionContext} containing the input to prepare.
 * @param {EntityPropertyDefinition[]} properties - {@link EntityPropertyDefinition} entries governing the input fields.
 * @returns {Promise<null>} Promise resolving to null after applying defaults.
 */
export function applyDefaults(
    { input }: ActionContext,
    properties: EntityPropertyDefinition[],
): Promise<null> {
    for (const property of properties) {
        if (input[property.name] === undefined && property.default !== undefined) {
            input[property.name] = resolveDefault(property.default);
        }
    }
    return Promise.resolve(null);
}

/**
 * Applies declared string conventions to the operation input.
 * @param {ActionContext} context - {@link ActionContext} containing the input to prepare.
 * @param {EntityPropertyDefinition[]} properties - {@link EntityPropertyDefinition} entries governing the input fields.
 * @returns {Promise<null>} Promise resolving to null after applying conventions.
 */
export function applyConventions(
    { input }: ActionContext,
    properties: EntityPropertyDefinition[],
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

function applyConvention(
    value: string,
    convention: EntityPropertyDefinition['convention'],
): string {
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
