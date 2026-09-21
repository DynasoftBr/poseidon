import { specification, type EntityReference, type PaginatedList } from '@poseidon/utilities';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { IncludedQueryable, Queryable } from '../src';
import type { Query } from '../src/interfaces/query';
import type { Resolver } from '../src/interfaces/utility-types';

interface Customer {
    _id: string;
    name: string;
    status: string;
    parent: EntityReference<Customer>;
}

interface Order {
    reference: string;
    amount: number;
    active: boolean;
    createdAt: Date;
    customer: EntityReference<Customer>;
    approver: EntityReference<Customer>;
    customers: PaginatedList<Customer>;
}

describe('Queryable', () => {
    it('should pass selected fields and pagination to the resolver', async () => {
        const rows = [{ reference: 'order-1', amount: 20 }];
        const resolve = vi.fn<Resolver<Order>>().mockResolvedValue(rows);
        const result = await new Queryable<Order>(resolve)
            .select('reference', 'amount')
            .paginate(20, 10)
            .toArray();

        expect(resolve).toHaveBeenCalledExactlyOnceWith({
            $select: ['reference', 'amount'],
            $skip: 20,
            $take: 10,
        });
        expect(result).toEqual(rows);
        expectTypeOf(result).toEqualTypeOf<{ reference: string; amount: number }[]>();
    });

    it('should request a single result when first is called', async () => {
        const row = { reference: 'order-1' };
        const resolve = vi.fn<Resolver<Order>>().mockResolvedValue(row);

        const result = await new Queryable<Order>(resolve).select('reference').first();

        expect(resolve).toHaveBeenCalledExactlyOnceWith({
            $select: ['reference'],
            $first: true,
        });
        expect(result).toEqual(row);
    });

    it('should return an array when the same query previously requested first', async () => {
        const rows = [{ reference: 'order-1' }];
        const resolve: Resolver<Order> = (query) => Promise.resolve(query.$first ? rows[0] : rows);
        const query = new Queryable<Order>(resolve).select('reference');

        expect(await query.first()).toEqual(rows[0]);
        expect(await query.toArray()).toEqual(rows);
    });

    it('should keep concurrent first and array execution modes independent', async () => {
        const rows = [{ reference: 'order-1' }];
        const resolve: Resolver<Order> = async (query) => {
            await Promise.resolve();
            return query.$first ? rows[0] : rows;
        };
        const query = new Queryable<Order>(resolve).select('reference');

        const results = await Promise.all([query.first(), query.toArray()]);

        expect(results).toEqual([rows[0], rows]);
        expect(query._query).toEqual({ $select: ['reference'] });
    });

    it('should combine successive specifications with AND without modifying them', () => {
        const order = specification<Order>();
        const active = order.field('active').equals(false);
        const alternatives = order
            .field('amount')
            .equals(0)
            .or(order.field('reference').equals(''));
        const query = new Queryable<Order>(undefined).where(active).where(alternatives);

        expect(query._query.$where).toEqual({
            kind: 'and',
            conditions: [active.expression, alternatives.expression],
        });
        expect(active.expression).toEqual({
            kind: 'comparison',
            field: 'active',
            operator: 'equals',
            operand: { kind: 'literal', value: false },
        });
        expect(new Queryable<Order>(undefined).where(active)._query.$where).toEqual(
            active.expression,
        );
    });

    it('should build inline specifications for root and included entities', async () => {
        const order = specification<Order>();
        const resolve = vi.fn<Resolver<Order>>().mockResolvedValue([]);
        await new Queryable<Order>(resolve)
            .where((o) => o.field('amount').greaterThan(100).or(o.field('active').equals(true)))
            .where(order.field('reference').equals('order-1'))
            .include('customer', (customers) =>
                customers
                    .where((customer) =>
                        customer.field('name').equals(order.reference('reference', 'root')),
                    )
                    .select('name'),
            )
            .select('reference', 'customer')
            .paginate(0, 20)
            .toArray();

        expect(resolve).toHaveBeenCalledExactlyOnceWith({
            $where: {
                kind: 'and',
                conditions: [
                    order.field('amount').greaterThan(100).or(order.field('active').equals(true))
                        .expression,
                    order.field('reference').equals('order-1').expression,
                ],
            },
            $include: {
                customer: {
                    $where: specification<Customer>()
                        .field('name')
                        .equals(order.reference('reference', 'root')).expression,
                    $select: ['name'],
                },
            },
            $select: ['reference', 'customer'],
            $skip: 0,
            $take: 20,
        });
    });

    it('should distinguish field references from literal strings', () => {
        const order = specification<Order>();
        const condition = order
            .field('reference')
            .equals(order.reference('reference'))
            .and(order.field('reference').equals('reference'));
        const query = new Queryable<Order>(undefined).where(condition);
        expect(query._query.$where).toEqual({
            kind: 'and',
            conditions: [
                {
                    kind: 'comparison',
                    field: 'reference',
                    operator: 'equals',
                    operand: { kind: 'field', path: ['reference'], scope: 'candidate' },
                },
                {
                    kind: 'comparison',
                    field: 'reference',
                    operator: 'equals',
                    operand: { kind: 'literal', value: 'reference' },
                },
            ],
        });
    });

    it('should record root property selectors inside related conditions', () => {
        const order = specification<Order>();
        const customer = specification<Customer>();
        const condition = customer
            .field('name')
            .equals(order.reference('reference', 'root'))
            .and(
                customer
                    .field('status')
                    .equals(order.reference((root) => root.approver._id, 'root')),
            );
        const query = new Queryable<Order>(undefined).include('customer', (c) =>
            c.where(condition),
        );
        expect(query._query.$include).toEqual({ customer: { $where: condition.expression } });
        expect(JSON.stringify(condition.expression)).toContain('"path":["approver","_id"]');
    });

    it('should preserve separate include filters and recursive nested selections', () => {
        const query = new Queryable<Order>(undefined)
            .where(specification<Order>().field('active').equals(true))
            .include('approver')
            .include('customer', (customer) =>
                customer
                    .where(specification<Customer>().field('status').equals('active'))
                    .include('parent', (parent) => parent.select('name').recursive())
                    .select('name', 'parent'),
            );

        expect(query._query).toEqual({
            $where: specification<Order>().field('active').equals(true).expression,
            $include: {
                approver: true,
                customer: {
                    $where: specification<Customer>().field('status').equals('active').expression,
                    $include: { parent: { $select: ['name'], $recursive: true } },
                    $select: ['name', 'parent'],
                },
            },
        });
    });

    it('should paginate explicitly declared collection relationships', () => {
        const query = new Queryable<Order>(undefined).include('customers', (c) =>
            c.select('name').paginate(0, 5),
        );
        expect(query._query.$include).toEqual({
            customers: { $select: ['name'], $skip: 0, $take: 5 },
        });
    });

    it('should extend an existing query description when chained', () => {
        const description: Query<Order> = { $select: ['reference'] };
        const query = new Queryable<Order>(undefined, description).select('amount');

        expect(query._query).toBe(description);
        expect(description.$select).toEqual(['reference', 'amount']);
    });

    it('should propagate resolver failures', async () => {
        const error = new Error('Query unavailable');
        const resolve = vi.fn<Resolver<Order>>().mockRejectedValue(error);

        await expect(new Queryable<Order>(resolve).toArray()).rejects.toBe(error);
    });

    it('should reject execution when only a query description is available', () => {
        const query = new IncludedQueryable<Customer>().select('name');

        expect(query._query).toEqual({ $select: ['name'] });
        expect(() => query.toArray()).toThrow('Query execution requires a resolver.');
    });

    it('should retain supplied included-query descriptions', () => {
        const description: Query<Customer> = { $skip: 5, $take: 5 };
        const query = new IncludedQueryable<Customer>(description).recursive();

        expect(query._query).toEqual({ $skip: 5, $take: 5, $recursive: true });
    });
});
