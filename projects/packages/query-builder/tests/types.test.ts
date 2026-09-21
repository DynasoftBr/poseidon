import type { PaginatedList } from '@poseidon/utilities';
import { describe, expect, expectTypeOf, it } from 'vitest';
import ts from 'typescript';
import path from 'node:path';
import { Queryable, type EntityReference } from '../src';
import type { IncludableKeys, NewProperty, SimpleKeys } from '../src/interfaces/utility-types';

interface Customer {
    _id: string;
    name: string;
    email: string;
}
interface Order {
    amount: number;
    status: string;
    nickname: string | null;
    optional?: number;
    customer: EntityReference<Customer>;
    backup?: EntityReference<Customer> | null;
    customers: PaginatedList<Customer>;
    embedded: Customer;
    array: Customer[];
    idOnly: { _id: string };
    page: PaginatedList<Customer>;
}

describe('Query result types', () => {
    it('should expose only selected related fields and preserve collection shapes', () => {
        const _query = new Queryable<Order>(undefined)
            .include('customer', (c) => c.select('name'))
            .include('backup', (c) => c.select('name'))
            .include('customers', (c) => c.select('name'))
            .include('page', (c) => c.select('name'));
        type Result = Awaited<ReturnType<typeof _query.first>>;
        expectTypeOf<Result['customer']>().toEqualTypeOf<{ name: string }>();
        expectTypeOf<Result['backup']>().toEqualTypeOf<{ name: string } | null | undefined>();
        expectTypeOf<Result['customers']>().toEqualTypeOf<PaginatedList<{ name: string }>>();
        expectTypeOf<Result['page']>().toEqualTypeOf<PaginatedList<{ name: string }>>();
    });

    it('should infer exact aggregation keys and replace existing properties', () => {
        const _query = new Queryable<Order>(undefined).aggregate((a) =>
            a.$group('status').$sum('amount', 'total'),
        );
        type Result = Awaited<ReturnType<typeof _query.first>>;
        expectTypeOf<Result>().toEqualTypeOf<{ status: string; total: number }>();
        expectTypeOf<NewProperty<{ total: string }, 'total', number>>().toEqualTypeOf<{
            total: number;
        }>();
        expectTypeOf<SimpleKeys<Order>>().toEqualTypeOf<
            'amount' | 'status' | 'nickname' | 'optional'
        >();
        expectTypeOf<IncludableKeys<Order>>().toEqualTypeOf<
            'customer' | 'backup' | 'customers' | 'page'
        >();
    });
});

function compileExpression(expression: string): ts.Diagnostic[] {
    const filename = path.resolve('tests/type-check-virtual.ts');
    const source = `
        import { Queryable, type EntityReference } from '../src';
        import { specification, type PaginatedList } from '@poseidon/utilities';
        const order = specification<Order>();
        interface Customer { _id: string; name: string; email: string; }
        interface Order { amount: number; status: string; customer: EntityReference<Customer>; embedded: Customer; array: Customer[]; idOnly: { _id: string }; customers: PaginatedList<Customer>; }
        declare const query: Queryable<Order>;
        ${expression}
    `;
    const options: ts.CompilerOptions = {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (file, languageVersion) =>
        file === filename
            ? ts.createSourceFile(file, source, languageVersion, true)
            : getSourceFile(file, languageVersion);
    const program = ts.createProgram([filename], options, host);
    return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === filename);
}

describe('Invalid query types', () => {
    it.each([
        "query.include('embedded');",
        "query.include('array');",
        "query.include('idOnly');",
        "query.include('amount');",
        "query.where(o => o.field('missing').equals(1));",
        "query.where(o => o.field('amount').equals('wrong'));",
        "query.include('customer', c => c.where(customer => customer.field('amount').equals(1)));",
        "query.where(order.field('amount').equals('amount'));",
        "query.where(order.field('amount').equals(order.reference('status')));",
        "query.where(order.field('amount').equals(order.reference(root => root.status, 'root')));",
        "query.aggregate(a => a.$sum('amount', 'total')).select('missing');",
        "query.include('customer', c => c.select('name')).first().then(r => r.customer.email);",
        "query.where(specification<{ amount: string }>().field('amount').equals('x'));",
        "query.where(order.field('status').greaterThan(10));",
        "query.where(specification<Customer>().field('name').equals('x'));",
        "query.having(h => h.$sum('amount', '$eq', 'amount'));",
    ])('should reject invalid expression %s', (expression) => {
        expect(compileExpression(expression)).not.toHaveLength(0);
    });

    it('should infer relationship targets for both include forms', () => {
        expect(
            compileExpression(
                `query.include('customer').include('customers', c => c.select('name').paginate(0, 5));`,
            ),
        ).toEqual([]);
    });

    it('should accept compatible field references and literals', () => {
        expect(
            compileExpression(`query
            .where(order.field('amount').equals(10))
            .where(order.field('amount').equals(order.reference('amount')))
            .where(order.field('amount').equals(order.reference(root => root.amount, 'root')));`),
        ).toEqual([]);
    });
});
