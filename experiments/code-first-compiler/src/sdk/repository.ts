import type { Entity } from './entity.js';
import type { PaginatedResult } from './paginated-result.js';

type StoredKeys<T> = {
    [K in keyof T]: T[K] extends PaginatedResult<unknown> ? never : K;
}[keyof T];

export type CreateInput<T> = Pick<T, Exclude<StoredKeys<T>, keyof Entity>>;

export abstract class Repository<T extends Entity> {
    async create(_input: CreateInput<T>): Promise<T> {
        throw new Error('Compilation prototype: runtime transport is not implemented.');
    }
}
