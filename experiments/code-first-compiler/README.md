# Code-first compilation experiment

Throwaway example: Customer, Order, ApprovalRequest, and Notification extend Entity, with matching repositories extending Repository; Money is embedded. Order references Customer; Customer declares the reverse, paginated orders relationship. Order creation has a before-rule to mark large orders for approval and an after-rule to create an approval request and record a notification.

Run from the project root, using the existing installed TypeScript dependency:

```sh
node experiments/code-first-compiler/build.mjs
```

## What compilation does

1. Type-check the source with TypeScript.
2. Read class types and decorators through the TypeScript compiler API, without executing authored code.
3. Infer entity names and matching repositories; include inherited system properties.
4. Extract registered rules, conditions, ordered consequence actions, and input mappings; verify generated references resolve.
5. Emit JavaScript modules into `output/javascript/` and one JSON Schema 2020-12 document into `output/definitions.json`, with entity and embedded definitions under `$defs`.

Select `#/$defs/Customer` or `#/$defs/Order` within that document to validate the corresponding entity. The root is a schema catalog: validating against the root alone does not apply its definitions. Reusable schemas use standard `$ref` references rather than a separate property/type language.

For example, Order's `quantity: number` with `@Integer({ min: 1, max: 100 })` becomes `{ "type": "integer", "minimum": 1, "maximum": 100 }`; its status union becomes an enum. Customer's nullable notes remain a required property that accepts a string or null.

Numeric bounds belong to `@Integer({ min, max })` and `@Decimal({ min, max })`; no separate numeric Min/Max decorators are exposed. Bounds are optional and inclusive. Integer bounds use safe integer literals, while Decimal bounds use exact decimal strings. Money.amount demonstrates `@Decimal({ min: '0', max: '99999999999999.9999' })`, importing the Decimal value type as DecimalValue to distinguish it from the decorator. These bounds belong to this example, not to all Money values.

Decimal bounds are emitted as Poseidon `decimalMinimum` and `decimalMaximum` validation extensions on the string schema. Standard JSON Schema minimum/maximum do not constrain strings. Exact runtime comparison requires support for these keywords in the runtime schema validator, which is outside this compilation prototype. Compilation rejects malformed bounds and inverted ranges without converting decimal bounds to floating-point numbers.

String and array size constraints use `@Length({ min, max })`. Customer.name demonstrates minLength/maxLength; Customer.tags demonstrates minItems/maxItems with string items. The compiler rejects negative, fractional, or inverted length bounds and unsupported property types. Nullable strings and arrays apply bounds only to their non-null value.

Persisted entity definitions contain keyed `actions` and `relationships` objects alongside `properties`; repository presence determines persistence, and embedded Money omits both. Actions are extracted from repository signatures, including the inherited `create` action; each contains inline `input` and an `output` schema. Authored actions require inline inputs; registered entity properties become `$ref` references. Creation inputs exclude system fields and relationship projections while retaining property validation constraints. Required names appear in the containing object's `required` array. No inheritance or repository layer appears in the output.

## Relationships

Order declares `@References(Customer) customer: EntityReference<Customer>`. The value is `{ _id }`; its schema references `$defs.EntityReference`, while relationship metadata identifies Customer. ApprovalRequest.order and Notification.approvalRequest use the same pattern, including nested reference objects in rule input mappings. EntityId remains the scalar type of `_id`, not the relationship property type.

Customer.orders declares `@References(Order, { through: 'customer' })` and `PaginatedResult<Order>`. TypeScript restricts through to EntityReference properties and verifies that the selected reference targets Customer; it rejects strings, scalar IDs, missing fields, wrong targets, and unpaginated collections. The compiler also verifies SDK type identity and matching relationship metadata. The reference generic has a type-only target marker; serialized references contain only `_id`.

Reference decorators use direct classes. The compiler extracts them without execution and removes metadata decorators and imports used only by metadata or types, retaining runtime imports such as base classes. Customer/Order references therefore do not introduce runtime circular dependencies.

Including customer will expand the same property with loaded Customer fields; it will not introduce a separate property beside a customerId. The persisted/write schema accepts only `{ _id }`; loaded projections need their own result schema. Customer.orders is a non-stored paginated projection, excluded from stored properties and create input. Actual include execution, projection typing, and result-schema generation are future query work, not implemented in this compilation prototype.

`actions` and `relationships` are Poseidon extension metadata in the same JSON Schema document. Standard validators do not interpret them as validation keywords; select an action's input schema for input validation. The relationship target's `$ref` identifies the target schema and does not load records. Strict validators may require these extension keywords to be registered. Pagination and relationship execution are not implemented here.

## Files to inspect

- `src/sdk/`: base classes and decorator declarations.
- `src/customers/` and `src/orders/`: authored entities and repositories.
- `build.mjs`: schema extraction and JavaScript emission.
- `src/orders/order-rules.ts`: authored specifications and typed consequence pipelines.
- `src/orders/order-repository.ts`: lifecycle registration and candidate mutation action.
- `rule-schema.mjs`: AST extraction of conditions and input mappings.
- `output/definitions.json`: generated definitions for runtime validation and client inspection.
- `output/javascript/`: compiled code, emitted as modules rather than a single bundle.

## Rule flow output

`before` and `after` are objects keyed by the exported rule name. Each rule includes a description and explicit `order`, inferred from registration array order. Conditions identify the selected property with `field: "#/$defs/Order/properties/total"`; this is a Poseidon value selector, not a JSON Schema `$ref` operation. The threshold is a runtime setting reference.

Consequence actions remain ordered arrays. Each step's name identifies its typed result-bag entry. Action pointers reuse existing contracts; `arguments` describe values selected from `input` or previous `results`, or literal values. The notification maps `results.approval._id`. The build reads simple expression mappers without executing them and rejects unsupported mapping syntax instead of guessing what it does.

Action reference callbacks such as `() => OrderRepository.prototype.markPendingApproval` are compile-time declarations, avoiding eager circular lookups. Registered create overrides must only forward their original input to super. The compiler also rejects redeclared system fields; lint is not implemented or run in this experiment.

The before-rule operates on the runtime-prepared candidate; the after-rule receives the saved Order and checks its pending status. Applying returned candidate changes across isolation boundaries remains runtime work: ordinary JavaScript mutation alone does not mutate an object in another process.

The repository transport, setting lookup, and rule SDK are compilation scaffolding; emitted modules are not an operational rule engine. The runtime would enforce protected system fields and configure format validation for email and dates; JSON Schema's `readOnly` is metadata, not an authorization check. Entity schemas describe complete stored entities, while action input schemas describe requests. Money illustrates decimal-string transport and three sample currencies; decimal arithmetic, currency catalogs, rule execution, and a Poseidon extension meta-schema are not implemented.

No tests or lint are included or required for this experiment.
