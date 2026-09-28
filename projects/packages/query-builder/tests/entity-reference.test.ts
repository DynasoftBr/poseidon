import { expect, expectTypeOf, it } from 'vitest';
import type { EntityRef } from '@poseidon/utilities';

interface Customer {
    _id: string;
    name: string;
}

it('should represent a typed relationship with only an ID at runtime', () => {
    const reference: EntityRef<Customer> = { _id: 'customer-1' };
    expect(JSON.stringify(reference)).toBe('{"_id":"customer-1"}');
    expectTypeOf(reference).not.toHaveProperty('name');
    expectTypeOf<EntityRef<Customer>>().not.toExtend<EntityRef<{ _id: string; total: number }>>();
});

it('should preserve the target entity type for relationship inference', () => {
    type Target<R> = R extends EntityRef<infer T> ? T : never;
    expectTypeOf<Target<EntityRef<Customer>>>().toEqualTypeOf<Customer>();
    expectTypeOf<EntityRef<{ _id: 'specific-id' }>['_id']>().toEqualTypeOf<'specific-id'>();
});
