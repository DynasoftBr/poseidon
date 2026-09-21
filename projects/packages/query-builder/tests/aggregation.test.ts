import { describe, expect, it } from 'vitest';
import { Queryable } from '../src';

interface Order {
    amount: number;
    quantity: number;
    discount: number;
    status: string;
}

describe('Aggregation', () => {
    it('should describe grouped aggregate fields', () => {
        const query = new Queryable<Order>(undefined).aggregate((a) =>
            a.$group('status').$sum('amount').$count('quantity').$avg('discount'),
        );

        expect(query._query.$aggregate).toEqual({
            status: { field: 'status', operator: '$group' },
            amount: { field: 'amount', operator: '$sum' },
            quantity: { field: 'quantity', operator: '$count' },
            discount: { field: 'discount', operator: '$avg' },
        });
    });

    it('should retain source fields when aggregates have aliases', () => {
        const query = new Queryable<Order>(undefined)
            .aggregate((a) => a.$sum('amount', 'total').$count('quantity', 'count'))
            .aggregate((a) => a.$avg('discount', 'average'));

        expect(query._query.$aggregate).toEqual({
            total: { field: 'amount', operator: '$sum' },
            count: { field: 'quantity', operator: '$count' },
            average: { field: 'discount', operator: '$avg' },
        });
    });

    it('should keep sum count and average conditions distinct', () => {
        const query = new Queryable<Order>(undefined)
            .having((h) => h.$sum('amount', '$eq', 100).$count('quantity', '$eq', 5))
            .having((h) => h.$or((or) => or.$avg('discount', '$eq', 0).$sum('amount', '$eq', 0)));

        expect(query._query.$having).toEqual([
            { $sum: { amount: { $eq: 100 } } },
            { $count: { quantity: { $eq: 5 } } },
            [{ $avg: { discount: { $eq: 0 } } }, { $sum: { amount: { $eq: 0 } } }],
        ]);
    });

    it('should describe field operands for each aggregate condition', () => {
        const query = new Queryable<Order>(undefined).having((h) =>
            h
                .$sum('amount', '$eq', 'amount', true)
                .$count('quantity', '$eq', 'quantity', true)
                .$avg('discount', '$eq', 'discount', true),
        );

        expect(query._query.$having).toEqual([
            { $sum: { amount: { $eq: '$[amount]' } } },
            { $count: { quantity: { $eq: '$[quantity]' } } },
            { $avg: { discount: { $eq: '$[discount]' } } },
        ]);
    });

    it('should describe aggregate-to-aggregate comparisons', () => {
        const query = new Queryable<Order>(undefined).having((h) =>
            h
                .$sum('amount', '$eq', (other) => other.$avg('discount'))
                .$count('quantity', '$eq', (other) => other.$sum('amount'))
                .$avg('discount', '$eq', (other) => other.$count('quantity')),
        );

        expect(query._query.$having).toEqual([
            { $sum: { amount: { $eq: { $avg: 'discount' } } } },
            { $count: { quantity: { $eq: { $sum: 'amount' } } } },
            { $avg: { discount: { $eq: { $count: 'quantity' } } } },
        ]);
    });
});
