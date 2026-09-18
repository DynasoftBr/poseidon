# Poseidon architecture

Poseidon is a self-describing business-data runtime and API. Its own system entities and entities created by users share the same declarative model.

## Product boundary

Poseidon is the business-logic and authorization layer over a database. Clients use its API to query entities and execute commands under the authenticated user's permissions. In that sense, it can be treated as a business-focused data system: it exposes a smaller, domain-aware interface rather than the general capabilities of the underlying database. The product boundary is the business API, exposed through protocol adapters; HTTP is the current transport.

Poseidon will provide a model-generated typed client exposing the `PoseidonContext` interface described below. The repository is backend-only; Portal, browser rendering, UI compilation, and frontend packages have been removed.

The intended direction is that every application calling Poseidon is registered as an App, including applications that use only unauthenticated flows. Registration gives the application a public client or app identifier and the authentication and access configuration associated with it. A public identifier selects the tenant, application, exposed operations, origin policy, and throttling policy; it is not a credential and must not grant authority because browser clients cannot keep secrets and identifiers can be copied. Authenticated user access, confidential server credentials, and explicitly public commands will be designed separately when authentication is implemented.

## Protocol adapters and hosted instances

Protocol adapters expose the same business runtime and data through different transports. They translate requests and responses and establish the caller's authentication context; business behavior and authorization remain shared runtime responsibilities. The intended package naming is HTTP adapter for the existing server package, including its startup and composition wiring. A separate server package is not required solely to host that wiring. A future gRPC adapter, or another protocol adapter justified by a concrete use case, follows the same boundary.

The hosted product flow is that signing up provisions a Poseidon instance with all supported protocol adapters enabled. Once gRPC is supported, the instance exposes both HTTP and gRPC against the same runtime and database. Developers choose how their application connects without provisioning another instance or making a separate deployment for each protocol. Adapter package boundaries do not imply separate deployments.

The repository currently implements HTTP in `projects/poseidon/server`; the package rename, gRPC adapter, and hosted provisioning remain to be implemented.

### Unified HTTP contract

The business API uses one route, `POST /:entityTypeName`, with `{ "action": "onboard", "input": { ... } }`. The path scopes the action to its entity type. Built-in `get`, `query`, `create`, `update`, `delete`, and `validate` operations use the same contract as named model actions; an action's operation does not select an HTTP verb. Entity IDs belong in `input._id`, and updates supply the current `input._version` alongside changed fields. Successful calls return the action result, or JSON null for no result. Health checks are infrastructure endpoints, separate from this business API.

Login and signup will also be APIActions through this endpoint. Actions must explicitly declare whether unauthenticated callers may invoke them; trusted server code remains responsible for credentials and session handling. HTTP request–response is the selected starting point. WebSockets may support future subscriptions or bidirectional updates when required.

### Model-generated typed client

Clients should work through the same `PoseidonContext` interface, with repositories exposing the properties and named APIActions of their entity types. Generate TypeScript entity types, runtime entity tokens, and typed repository action methods directly from the Poseidon model, including user-created types. The intended call shape is:

```ts
await context.repository(Customer).onboardCustomer({ name: 'Acme' });
```

Here `context` implements `PoseidonContext`, `Customer` is a generated runtime token identifying the entity type, and `onboardCustomer` is a generated method with model-defined input and result types. The example assumes that action accepts a `name` input. Passing the token lets TypeScript infer the repository type while also supplying its identity at runtime; `repository<Customer>()` alone cannot do that because generic type arguments are erased. No custom compiler transform or decorators are required.

The client translates these calls into the JSON API contract; business behavior, validation, and authorization remain in the runtime. Generated declarations and methods must be regenerated when entity types, properties, or actions change. They describe the model revision used for generation, not a guarantee that an already-built client automatically acquires later model changes. Generation, distribution, and refresh mechanics remain to be implemented.

GraphQL is not required for this developer experience: ordinary TypeScript calls provide autocomplete and typed entities and actions without introducing GraphQL queries, mutations, or a second schema representation. The action endpoint is implemented; client generation remains planned.

## Workspace

```text
projects/
  poseidon/server/             HTTP adapter and composition root (rename planned)
  packages/
    models/                     declarative entity and index types
    data-access/               MongoDB-only persistence implementation
    runtime/                   bootstrap, action execution, and queries
    service-utils/             logging and shared service infrastructure
```

`@poseidon/models` and `@poseidon/runtime` do not know MongoDB or transport protocols. The HTTP adapter currently composes the runtime with the MongoDB implementation from `@poseidon/data-access`.

All runtime entities use `Entity<TData>`: `id`, `entityTypeId`, `data`, `version`, and audit metadata. Core types specialize the same envelope with typed data; for example, an EntityProperty has `entityTypeId: 'entity-property'`, while `data.entityTypeId` identifies the type that owns the property. Bootstrap records use this representation directly, and MongoDB only maps `id` to `_id` at the persistence boundary.

EntityTypes are deliberately flat. The earlier `abstract` and `superTypeId` fields were removed because no current behavior required inheritance; shared behavior should remain explicit until a concrete use case justifies inheritance semantics.

## Bootstrap

Server startup connects to MongoDB and idempotently creates any missing system user, core EntityTypes, EntityProperties, and Index definitions. This makes bootstrap additive when a new core model record is introduced. The bootstrap model is ordinary Poseidon model data.

## Environments and promotion

Development and test environments use isolated Poseidon instances and databases with their own authorization configuration. Promotion through an authorized API, candidate snapshots, and coordination with data migrations remain future work outside the current runtime. Restoring model definitions does not reverse data migrations.

### Test data and environment initialization

A test database needs the candidate model, suitable starting business data, and test integration configuration. It does not inherently need every production record. The proposed starting point is generated examples and representative, anonymized production samples, preserving related records needed by a scenario, together with the captured fixtures described under regression testing. External integrations must use controlled responses or test endpoints so tests do not dispatch real orders or send production notifications.

Migration validation is a separate need from representative workflow tests. For example, checking whether every customer date string can be converted can scan the affected production fields without mutating them; a sample alone cannot establish that every record will convert. Such checks still consume production resources, and results become stale as production changes. Applying the migration requires revalidation and coordination with concurrent writes.

Full copies remain an option when the size and cost justify them. MongoDB Atlas can restore a backup snapshot to a separate cluster, but this is not a free or instantaneous branch of a large database. A replica-set secondary provides redundancy and is not an independently writable test environment; a shard partitions a database and is not a test copy. See MongoDB's [snapshot restoration](https://www.mongodb.com/docs/atlas/backup/cloud-backup/restore-from-snapshot/) and [replication](https://www.mongodb.com/docs/manual/replication/) documentation.

If frequent refreshes later justify a maintained copy, [Change Streams](https://www.mongodb.com/docs/manual/changestreams/) could feed a separate database after an initial consistent copy. This would require a defined copy/stream handoff, resumable processing, and recovery when retained history is insufficient. Synchronization must stop at a known boundary before that copy is modified for testing, otherwise production updates can conflict with test changes. Application-level dual writes are not the selected design. Dataset size, refresh needs, and operational cost should determine whether this additional mechanism is worthwhile; no full-copy or continuous-copy strategy is committed yet.

### Model evolution and data migrations

Model edits must account for existing records as well as future writes. The proposed requiredness semantics distinguish optional fields, fields required on creation, and fields required on every save. Under the proposed creation-only policy, existing records missing the field remain editable, while a populated value cannot subsequently be cleared. The API must enforce the policy and expose enough metadata for forms to reflect it. The exact property representation, treatment of null/empty values, and transition between policies remain to be designed; this is not an implemented three-state field.

Property type changes should not silently reinterpret stored data. A proposed string-to-date migration declares the input format, previews conversion, identifies incompatible or ambiguous values, and resolves them before activation. A number-to-date conversion similarly needs an explicit meaning, such as a timestamp unit, rather than an implicit cast. The direction is to permit justified type changes through validated migrations instead of forbidding all changes or accepting arbitrary edits.

Promotion must check the current production data, not assume the test copy is still current. For small affected datasets, briefly pausing affected writes while converting and activating the new definition is a possible initial strategy. Larger migrations may require adding a compatible representation, migrating records gradually, and retiring the old representation afterward. Execution, failure recovery, and rollback semantics remain open; changing a release pointer does not undo transformed business data.

## Action execution and persistence

`RuntimeContext` binds the caller and storage; `RuntimeRepository` resolves named APIActions and executes their before steps, main operation, and after steps. Built-in operations are available when no model action of the same name is declared. `EntityService`, mutation events, projection writes, relationship-link maintenance, and event publication have been removed. MongoDB stores entities directly in a collection per EntityType; deletes remove the record. Existing historical collections are not dropped by this change.

Create/update preparation retains defaults, conventions, business rules, property validation, and embedded structure validation. EntityType creation adds system properties, updates retain them, and names remain immutable. Updates merge changed fields, increment the version, and use optimistic concurrency. The `validate` action returns `{ valid, problems }` without persisting data; writes still validate independently. Before steps and the main operation share a transaction, with after steps running after that action commits; an enclosing transaction, such as a compound business action, can group multiple actions.

Queries accept declarative filters, offset, and limit. MongoDB resolves filter property IDs against the type's properties. There is no separate runtime pagination validation. Index definitions are reconciled at startup; creation-event-driven index realization has been removed with event publication.

Relationship properties and the `relation-link` bootstrap type are removed for now. References use ordinary string IDs or arrays of strings, without relationship metadata. Embedded object structures remain values owned by their containing entity; nested payloads never implicitly create or update separately persisted records. Related records must be created or updated through explicit actions.

The planned typed action contract is a cascade: each operation declares input/output EntityTypes, adjacent steps must agree, and each action's public input/output are inferred recursively from its first/last executed step. Without before/after steps, these are the main operation's types. Client generation uses that resolved contract; type declarations and generation are not implemented by this transport simplification.

### Command tracing and causal relationships

The proposed tracing direction records how a request produced its outcome, alongside current entity data. Capture the entry operation and input, the commands it invokes, their inputs and outputs or errors, evaluated branches, and resulting writes. Trace storage and retention remain to be designed.

A correlation ID starts at request entry and follows the work caused by that request. If Poseidon later publishes to a queue or invokes an asynchronous listener, the message carries that ID and the consumer records receipt and subsequent work under it. Each operation and event also needs its own identity and a causation reference to its immediate trigger, allowing branches, retries, and parallel work to be distinguished. Correlation groups work; causation explains its relationships. These identifiers are diagnostic context, not authorization credentials or guarantees of delivery.

An independent external fact starts a new correlation. A carrier posting that a package was delivered starts a fresh request, and resulting delivery handling shares its correlation ID. The shipment ID relates that activity to the business record; it does not make delivery a continuation of the earlier order request. This is a more useful asynchronous boundary than separating order creation and stock reservation merely to introduce messaging: those operations can remain in one request when that meets the business need.

This design does not introduce a queue or durable event-listening framework into the current scope. If such consumers are later required, their delivery and completion contracts must be defined separately from correlation and from action execution.

### Regression tests from observed behaviour

The proposed direction is to derive regression scenarios from selected production execution traces. A scenario needs its original entry input, relevant starting records and permissions, the model/command versions involved, observed outcomes, and controlled sources of nondeterminism such as time, generated IDs, randomness, and external service responses. The capture mechanism must account for data read during execution; final mutation events alone are insufficient to reconstruct the starting fixture.

Replay invokes the original entry operation against the candidate definitions in an isolated test environment. Downstream internal commands execute again; their recorded outputs are expectations, not replacements for execution. External responses can be supplied from controlled fixtures. Where asynchronous consumers are involved, the runner must know when the scenario has completed and compare causal outcomes without demanding one arbitrary completion order for independent work. These replay and completion mechanisms remain to be implemented.

Avoid retaining every production execution as a separate test. The proposed grouping uses executed command paths, branches taken, and resulting events, retaining representative fixtures and meaningful boundary cases. Different customer names may be irrelevant to one flow; dates of birth may select different eligibility branches. Relevance must follow actual rules and observed decisions rather than a universal list of ignored fields. One trace per path is not exhaustive coverage: values near thresholds, failures, and interactions between values can matter even when the command sequence looks the same. The selection algorithm and capture/storage limits remain open.

Future promotion tooling would run the retained regression suite against a candidate before promotion. AI may help curate scenarios and propose expectation changes when the intended business behaviour changes, such as removing a property or changing eligibility. A failing test must not simply rewrite its own expected output to match the candidate: each expectation change needs justification in the intended change, with user judgment where business intent is unclear. Captured production behaviour is evidence of a baseline, not proof that the old behaviour was correct or that all future cases are covered.
