import type { Entity } from './entity.js';
import type { EntityReference, EntityReferenceKeys } from './entity-reference.js';
import type { PaginatedResult } from './paginated-result.js';

export function EntityType(_options: { label: string }) {
    return (_value: Function, _context: ClassDecoratorContext): void => {};
}

export function Length(_options: { min?: number; max?: number } = {}) {
    return (_value: undefined, _context: ClassFieldDecoratorContext): void => {};
}

export function Decimal(_options: { min?: string; max?: string } = {}) {
    return (_value: undefined, _context: ClassFieldDecoratorContext): void => {};
}

export function Integer(_options: { min?: number; max?: number } = {}) {
    return (_value: undefined, _context: ClassFieldDecoratorContext): void => {};
}

export function Email() {
    return (_value: undefined, _context: ClassFieldDecoratorContext): void => {};
}

export function References<T extends Entity, K extends EntityReferenceKeys<NoInfer<T>> = never>(
    _target: new () => T,
    _options?: { through: K },
) {
    return <Owner extends Entity>(
        _value: undefined,
        _context: ClassFieldDecoratorContext<Owner,
            [K] extends [never] ? EntityReference<T> | null : PaginatedResult<T>>
            & ([K] extends [never] ? unknown
                : NonNullable<T[K]> extends EntityReference<Owner> ? unknown
                : { error: 'The reference must target the owning entity' }),
    ): void => {};
}

export function Action(_options: { label: string; description?: string }) {
    return (_value: Function, _context: ClassMethodDecoratorContext): void => {};
}

export function Rules(_options: { before?: readonly unknown[]; after?: readonly unknown[] }) {
    return (_value: Function, _context: ClassMethodDecoratorContext): void => {};
}
