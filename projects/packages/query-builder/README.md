# Poseidon query builder

Imported from [DynasoftBr/poseidon-query-builder](https://github.com/DynasoftBr/poseidon-query-builder) at `3c696f24d88595df7a3331355735b587204762ea`, retaining the upstream Unlicense.

The fluent builder produces query descriptions for a supplied resolver. It supports selection, filters and OR groups, includes and recursive includes, aggregation, having conditions, pagination, and first/array execution. This package has no database or transport implementation.

```ts
import { Queryable } from '@poseidon/query-builder';
import type { EntityReference } from '@poseidon/query-builder';
import type { Resolver } from '@poseidon/query-builder';

interface Customer {
    _id: string;
    name: string;
    status: string;
}

interface Order {
    reference: string;
    customer: EntityReference<Customer>;
}

export function customerOrders(resolve: Resolver<Order>) {
    return new Queryable<Order>(resolve)
        .include('customer', customer =>
            customer
                .where(c => c.field('status').equals('active'))
                .select('name'),
        )
        .select('reference', 'customer')
        .paginate(0, 20)
        .toArray();
}
```

The resolver determines query execution and validates returned data. Its boundary returns unknown; the builder exposes the inferred result type without performing runtime result validation. Root filters and include filters remain distinct query nodes; the resolver determines how unmatched relationships affect parent results.

`.where(specification)` and `.where(builder => specification)` replace the filter callback; repeated calls combine with AND. Specifications compose through `.and()`, `.or()`, `.not()`, and `.nor()`. The resolver receives their condition tree in `$where`, rather than the original filter arrays. Aggregate entries now retain both the source field and operator, keyed by the output name: `{ total: { field: "amount", operator: "$sum" } }`. `include` accepts only `EntityReference<T>` and `PaginatedList<T>` properties, including nullable and optional declarations; embedded objects and ordinary arrays are excluded. Included results infer the referenced entity or paginated item shape. Pagination fetching and `related` remain unimplemented. Builder chains share their query object, as in the source library; execution uses a separate top-level query object so `first()` does not change subsequent or concurrent `toArray()` calls.

The port uses the workspace's strict TypeScript, ESLint, filenames, and build configuration. Circular runtime imports were removed; having count/average now emit their respective operators, field operands are forwarded, and aggregate comparison callbacks record their operands. Vitest covers query descriptions, resolver execution, related filters, aggregation, and having conditions; coverage must reach at least 90% for statements, branches, functions, and lines.

Run `npm run typecheck -w @poseidon/query-builder`, `npm run lint -w @poseidon/query-builder`, and `npm run build -w @poseidon/query-builder` from the repository root. Run `npm run test:coverage -w @poseidon/query-builder` to check the coverage thresholds.
