import type { EntityProperty } from '@poseidon/models';

export function applyDefaultsAndConventions(
    input: Record<string, unknown>,
    properties: EntityProperty[],
): Record<string, unknown> {
    const data = { ...input };

    properties.forEach((property) => {
        if (data[property.name] === undefined && property.default !== undefined) {
            data[property.name] = resolveDefault(property.default);
        }
        const value = data[property.name];
        if (typeof value === 'string' && property.convention) {
            data[property.name] = applyConvention(value, property.convention);
        }
    });

    return data;
}

export function applyConventions(
    input: Record<string, unknown>,
    properties: EntityProperty[],
): Record<string, unknown> {
    return applyDefaultsAndConventions(
        input,
        properties.filter((property) => property.default === undefined),
    );
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
