import { expect, expectTypeOf, it } from 'vitest';
import type { EntityReference } from '../src';

interface Customer {
    _id: string;
    name: string;
}

it('should represent a typed relationship with only an ID at runtime', () => {
    const reference: EntityReference<Customer> = { _id: 'customer-1' };
    expect(JSON.stringify(reference)).toBe('{"_id":"customer-1"}');
    expectTypeOf(reference).not.toHaveProperty('name');
    expectTypeOf<EntityReference<Customer>>().not.toExtend<
        EntityReference<{ _id: string; total: number }>
    >();
});

it('should preserve the target entity type for relationship inference', () => {
    type Target<R> = R extends EntityReference<infer T> ? T : never;
    expectTypeOf<Target<EntityReference<Customer>>>().toEqualTypeOf<Customer>();
    expectTypeOf<EntityReference<{ _id: 'specific-id' }>['_id']>().toEqualTypeOf<'specific-id'>();
});
