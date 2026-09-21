import { describe, expect, it } from 'vitest';
import { specification } from '../src';

interface Order {
    total: number;
    status: string;
    active: boolean;
    createdAt: Date;
    note: string | null;
    customer: { name: string };
}

const order = specification<Order>();

describe('Specifications', () => {
    it('should compose immutable AND OR NOT and NOR trees', () => {
        const large = order.field('total').greaterThan(100);
        const draft = order.field('status').equals('draft');
        const pending = order.field('status').equals('pending');
        const combined = large.and(draft.or(pending));
        expect(combined.expression).toEqual({
            kind: 'and',
            conditions: [
                large.expression,
                { kind: 'or', conditions: [draft.expression, pending.expression] },
            ],
        });
        expect(draft.not().expression).toEqual({ kind: 'not', condition: draft.expression });
        expect(draft.nor(pending, large).expression).toEqual({
            kind: 'nor',
            conditions: [draft.expression, pending.expression, large.expression],
        });
        expect(large.expression.kind).toBe('comparison');
        expect(Object.isFrozen(combined.expression)).toBe(true);
        if (combined.expression.kind === 'and') {
            expect(Object.isFrozen(combined.expression.conditions)).toBe(true);
        }
    });

    it('should preserve zero empty false and null operands', () => {
        const expressions = [
            order.field('total').equals(0),
            order.field('status').equals(''),
            order.field('active').equals(false),
            order.field('note').equals(null),
        ];
        expect(expressions.map((s) => s.expression)).toEqual([
            {
                kind: 'comparison',
                field: 'total',
                operator: 'equals',
                operand: { kind: 'literal', value: 0 },
            },
            {
                kind: 'comparison',
                field: 'status',
                operator: 'equals',
                operand: { kind: 'literal', value: '' },
            },
            {
                kind: 'comparison',
                field: 'active',
                operator: 'equals',
                operand: { kind: 'literal', value: false },
            },
            {
                kind: 'comparison',
                field: 'note',
                operator: 'equals',
                operand: { kind: 'literal', value: null },
            },
        ]);
    });

    it('should capture dates without retaining mutable date objects', () => {
        const date = new Date('2026-01-01T00:00:00Z');
        const condition = order.field('createdAt').lessThan(date);
        date.setFullYear(2030);
        expect(condition.expression).toEqual({
            kind: 'comparison',
            field: 'createdAt',
            operator: 'less-than',
            operand: { kind: 'date', value: '2026-01-01T00:00:00.000Z' },
        });
    });

    it('should describe field operands with independent reference paths', () => {
        const root = order.reference((o) => o.customer.name, 'root');
        const local = order.reference('status');
        expect(root.operand).toEqual({ kind: 'field', path: ['customer', 'name'], scope: 'root' });
        expect(local.operand).toEqual({ kind: 'field', path: ['status'], scope: 'candidate' });
        expect(order.field('status').equals(root).expression).toEqual({
            kind: 'comparison',
            field: 'status',
            operator: 'equals',
            operand: root.operand,
        });
        expect(Object.isFrozen(root.operand.path)).toBe(true);
    });
});
