import { expectTypeOf, it } from 'vitest';
import type { PaginatedList } from '../src';

interface Customer {
    _id: string;
    name: string;
}

it('should preserve the item type across pages and asynchronous iteration', () => {
    expectTypeOf<PaginatedList<Customer>['items']>().toEqualTypeOf<readonly Customer[]>();
    expectTypeOf<ReturnType<PaginatedList<Customer>['next']>>().toEqualTypeOf<
        Promise<PaginatedList<Customer> | null>
    >();
    expectTypeOf<PaginatedList<Customer>>().toExtend<AsyncIterable<Customer>>();
    expectTypeOf<Customer[]>().not.toExtend<PaginatedList<Customer>>();
});
