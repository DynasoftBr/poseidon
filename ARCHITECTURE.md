# Poseidon architecture

Poseidon is a self-describing business-data runtime and API. Its own system entities and entities created by users share the same declarative model.

## Product boundary

Poseidon is the business-logic and authorization layer over a database. Clients use its API to query entities and execute commands under the authenticated user's permissions. In that sense, it can be treated as a business-focused data system: it exposes a smaller, domain-aware interface rather than the general capabilities of the underlying database. The product boundary is the business API, exposed through protocol adapters; HTTP is the current transport.

Poseidon does not provide a client library. The Portal is an application built with Poseidon, not part of the Poseidon core. Because it shares the repository, the Portal may reuse Poseidon types and build its own API utilities, but those utilities remain the Portal's responsibility. The browser shell, authored components, forms, routes, dialogs, and UI actions likewise belong to that application and its supporting UI packages. UI-specific models such as actions must not become Poseidon core entity types merely because the Portal stores or uses them through Poseidon.

The intended deployment boundary follows that separation: Poseidon can run as an API-only backend, and the Portal UI is served independently. UI compilation belongs to a supporting build service. Current repository and server composition do not make the Portal or its build lifecycle core runtime responsibilities.

Every tenant receives the Portal as Poseidon's administration environment, comparable to the WordPress admin area. A tenant may use it indefinitely as its internal dashboard, create and run multiple applications through it, or build an independent application that calls the same Poseidon API. Public experiences may expose a narrow flow, such as requesting a quote, without exposing the tenant's general data API.

The intended direction is that every application calling Poseidon is registered as an App, including applications that use only unauthenticated flows. Registration gives the application a public client or app identifier and the authentication and access configuration associated with it. A public identifier selects the tenant, application, exposed operations, origin policy, and throttling policy; it is not a credential and must not grant authority because browser clients cannot keep secrets and identifiers can be copied. Authenticated user access, confidential server credentials, and explicitly public commands will be designed separately when authentication is implemented.

## Protocol adapters and hosted instances

Protocol adapters expose the same business runtime and data through different transports. They translate requests and responses and establish the caller's authentication context; business behavior and authorization remain shared runtime responsibilities. The intended package naming is HTTP adapter for the existing server package, including its startup and composition wiring. A separate server package is not required solely to host that wiring. A future gRPC adapter, or another protocol adapter justified by a concrete use case, follows the same boundary.

The hosted product flow is that signing up provisions a Poseidon instance with the Portal and all supported protocol adapters enabled. Once gRPC is supported, the instance exposes both HTTP and gRPC against the same runtime and database. Developers choose how their application connects without provisioning another instance or making a separate deployment for each protocol. Adapter package boundaries do not imply separate deployments.

The Portal is the default administration application built on Poseidon and uses the HTTP adapter. Its planned **Connect your application** flow lets developers select HTTP or gRPC and presents the selected protocol's endpoint, required connection parameters, applicable credentials, and a working connection example. Independent desktop and server applications can consume the same instance through either supported protocol. Connection setup follows the App registration and authentication model described above; selecting a protocol does not change access rights.

This is the intended architecture and product flow. The repository currently implements HTTP in `projects/poseidon/server`; the package rename, gRPC adapter, hosted provisioning, and Portal connection flow remain to be implemented.

## Workspace

```text
projects/
  poseidon/server/             HTTP adapter and composition root (rename planned)
  poseidon/client/             trusted browser shell
  poseidon/portal/             initial authored component sources
  packages/
    model/                     declarative entity and index types
    data-access/               MongoDB-only persistence implementation
    runtime/                   bootstrap, commands, queries, and projections
    service-utils/             logging and shared service infrastructure
    ui-platform/               UI bootstrap, releases, artifacts, isolated compilation, forms
    ui-foundation/             React controls, shared form state, Tailwind tokens, Storybook
```

`@poseidon/models` and `@poseidon/runtime` do not know MongoDB or transport protocols. The HTTP adapter currently composes the runtime with the MongoDB implementation from `@poseidon/data-access`.

All runtime entities use `Entity<TData>`: `id`, `entityTypeId`, `data`, `version`, and audit metadata. Core types specialize the same envelope with typed data; for example, an EntityProperty has `entityTypeId: 'entity-property'`, while `data.entityTypeId` identifies the type that owns the property. Bootstrap records use this representation directly, and MongoDB only maps `id` to `_id` at the persistence boundary.

EntityTypes are deliberately flat. The earlier `abstract` and `superTypeId` fields were removed because no current behavior required inheritance; shared behavior should remain explicit until a concrete use case justifies inheritance semantics.

## Bootstrap

Server startup connects to MongoDB and idempotently creates any missing system user, core EntityTypes, EntityProperties, and Index definitions. This makes bootstrap additive when a new core model record is introduced. The bootstrap model is ordinary Poseidon model data.

## Portal environments and promotion

The agreed direction is that Portal owns development/test environments and promotion. Each environment has an isolated Poseidon instance and database; it can run the same backend version as production. Testing a business-model change does not require a new version of the Poseidon software. The runtime does not need development/production modes or a built-in promotion workflow: it serves its configured database and enforces the permissions configured there.

The end user receives Portal. During provisioning, a confidential server-side Portal identity initially owns the backend and configures its authorization policy. In production, that policy reserves changes to entity types, properties, commands, and other application definitions for Portal's promotion identity. In a development environment, Portal grants those rights to the people allowed to build, for example through a Developers group. Membership and permission changes must themselves be protected by the backend's authorization rules. Hiding an editor in Portal does not prevent a direct API request.

These are different authorization configurations using the same runtime rules, not different user passwords or special runtime knowledge of environments. Portal needs explicitly authorized provisioning and administration capabilities to establish the environment's policy; an arbitrary external process cannot acquire those rights by copying data. Test provisioning must deliberately establish its identities and credentials rather than blindly copying production secrets or trusting caller-supplied actor IDs. Production authentication and these permissions are planned, not supplied by the current local system actor.

Builders save and test changes in the development database. Promotion selects a fixed, tested set of application definitions and applies it through the authorized production API. That set includes related entity types, properties, rules, declarative commands, UI sources, and built UI artifacts where applicable. Production receives the selected final versions, not every intermediate development save or the development business records. A release record should identify exactly what was tested and promoted; further edits require another candidate. Coordinating activation across dependent definitions and artifacts remains to be designed, including handling concurrent production changes and failed promotion.

The earlier idea of making the core runtime resolve an environment-specific application snapshot is not the chosen starting point. Environment separation and promotion are Portal responsibilities. Event history provides an audit trail and a basis for restoring earlier definitions through new mutations, but restoring a definition does not automatically reverse data migrations. Policies for already-running business workflows when a definition changes remain open; automatic workflow-version pinning has not been selected.

### Test data and environment initialization

A test database needs the candidate model, suitable starting business data, and test integration configuration. It does not inherently need every production record. The proposed starting point is generated examples and representative, anonymized production samples, preserving related records needed by a scenario, together with the captured fixtures described under regression testing. External integrations must use controlled responses or test endpoints so tests do not dispatch real orders or send production notifications.

Migration validation is a separate need from representative workflow tests. For example, checking whether every customer date string can be converted can scan the affected production fields without mutating them; a sample alone cannot establish that every record will convert. Such checks still consume production resources, and results become stale as production changes. Applying the migration requires revalidation and coordination with concurrent writes.

Full copies remain an option when the size and cost justify them. MongoDB Atlas can restore a backup snapshot to a separate cluster, but this is not a free or instantaneous branch of a large database. A replica-set secondary provides redundancy and is not an independently writable test environment; a shard partitions a database and is not a test copy. See MongoDB's [snapshot restoration](https://www.mongodb.com/docs/atlas/backup/cloud-backup/restore-from-snapshot/) and [replication](https://www.mongodb.com/docs/manual/replication/) documentation.

If frequent refreshes later justify a maintained copy, [Change Streams](https://www.mongodb.com/docs/manual/changestreams/) could feed a separate database after an initial consistent copy. This would require a defined copy/stream handoff, resumable processing, and recovery when retained history is insufficient. Synchronization must stop at a known boundary before that copy is modified for testing, otherwise production updates can conflict with test changes. Application-level dual writes are not the selected design. Dataset size, refresh needs, and operational cost should determine whether this additional mechanism is worthwhile; no full-copy or continuous-copy strategy is committed yet.

### Model evolution and data migrations

Model edits must account for existing records as well as future writes. The proposed requiredness semantics distinguish optional fields, fields required on creation, and fields required on every save. Under the proposed creation-only policy, existing records missing the field remain editable, while a populated value cannot subsequently be cleared. The API must enforce the policy and expose enough metadata for forms to reflect it. The exact property representation, treatment of null/empty values, and transition between policies remain to be designed; this is not an implemented three-state field.

Property type changes should not silently reinterpret stored data. A proposed string-to-date migration declares the input format, previews conversion, identifies incompatible or ambiguous values, and resolves them before activation. A number-to-date conversion similarly needs an explicit meaning, such as a timestamp unit, rather than an implicit cast. The direction is to permit justified type changes through validated migrations instead of forbidding all changes or accepting arbitrary edits.

Promotion must check the current production data, not assume the test copy is still current. For small affected datasets, briefly pausing affected writes while converting and activating the new definition is a possible initial strategy. Larger migrations may require adding a compatible representation, migrating records gradually, and retiring the old representation afterward. Execution, failure recovery, and rollback semantics remain open; changing a release pointer does not undo transformed business data.

## Event sourcing and projections

Poseidon uses one mutation model for persisted business and model entities: commands append immutable events to one shared `events` collection and materialize current documents in a collection per EntityType. Bootstrap uses the same path for the system user, core EntityTypes, properties, and indexes.

Events and their current-state projections are written in the same MongoDB transaction. The runtime already has the resulting state when persisting a mutation, so the entity-type collection is updated synchronously with the event store. Each entity-type collection is itself the materialized projection; MongoDB views or a separate materialized-view refresh mechanism are unnecessary. This provides atomic writes and immediate read-after-write consistency while keeping the runtime small.

The planned notification mechanism is a MongoDB Change Stream watching inserts into the shared `events` collection. Transactional inserts become visible to the stream only after the transaction commits and is majority-committed; aborted transactions produce no insert notifications. The application forwards these committed events to live listeners. MongoDB-specific watching stays in `@poseidon/data-access`. This replaces direct post-commit notification from the mutation path and avoids introducing Kafka or a separate message broker for the current scope.

Notifications are best-effort live delivery, not a guarantee that every consumer receives or successfully processes every event. Consumer registration, acknowledgements, persisted processing positions, processing leases/status collections, and durable retry delivery are out of scope for now. A notification missed during downtime does not lose the stored event or affect the synchronously updated projection. An in-process `EventEmitter` may distribute notifications received from the Change Stream, but emitting a notification is not evidence that consumer work completed. This decision supersedes the earlier plan to add a durable outbox.

`EntityService` handles create, get, update, delete, and query for every EntityType, including `entity-type` and `entity-property`. `POST /api/v1/entities/:entityTypeId` accepts model-declared nested reference envelopes and commits their graph as one event/projection transaction. `GET`, `PATCH`, and `DELETE` use `/api/v1/entities/:entityTypeId/:id`; queries use `POST /api/v1/entities/:entityTypeId/query` with a declarative filter, offset, and limit. Nested entities infer their type from the reference property, are normalized to IDs in stored data, and never cause implicit deletion.

`Index` entities are reconciled to MongoDB indexes at startup and when their creation event is published. Each entity-type collection can have its own indexes for its query requirements, independently of the shared event store.

The event store will itself be represented by a system EntityType so that events can use the same model-driven querying and display capabilities, including an entity's history UI. Event records are read-only to users: ordinary create, update, and delete commands are unavailable. Persistence appends them internally, bypassing the ordinary entity mutation flow, so writing an event never generates another event. This is an explicit persistence exception, not a second event-sourced projection of the event store.

Historical restoration will create a new mutation rather than erase or rewrite events. The proposed restored state must satisfy the current EntityType model and applicable mutation rules. For example, restoring a customer from before a field became required on every save must let the user supply that field before saving; creation-only requiredness follows the model-evolution policy above. The restoration UI must show the proposed changes and validation conflicts and let the user resolve them before committing through the normal event/projection transaction; the detailed interaction remains to be designed.

To bound active history storage, a future retention job may create a snapshot of each entity's state at a chosen cutoff, such as five years ago, and move the events covered by that snapshot into archival storage. The snapshot becomes the entity's initial replay state, followed by events after the cutoff; it must represent the state at the cutoff, not today's state. Detailed history remains in the archive rather than being discarded. Snapshots alone do not reduce event storage: covered events leave the active store only after the snapshot and archive are safely recorded. Snapshot boundaries must identify exactly which events they cover so replay neither skips nor duplicates changes. The retention policy, archival access, and job implementation remain to be designed.

Transactional event writes and per-type projections are implemented; Change Stream notifications, the event-store EntityType, history and restoration UI, and snapshot/archive lifecycle are planned extensions.

Rules and query filters share `Specification`: comparisons address model property IDs and compose with `and`, `or`, and `not`. The runtime validates the full condition against the entity type, evaluates it for mutation rules, and passes the same condition and resolved property names to data access for MongoDB query translation; queries never execute rule consequences.

Comparison values are JSON scalars (strings, finite numbers, booleans, or null). Equality compares the whole field without coercion or implicit array membership; missing differs from null. `contains` means a case-sensitive literal substring for strings or exact scalar membership for arrays, without string coercion. Ordering requires numbers on both sides, and `exists` accepts a boolean and treats null as present. Empty `and` matches everything and empty `or` matches nothing. Invalid conditions or undeclared properties produce validation errors. The query filter wire format now uses the same `kind`/`propertyId` structure as rules; the former `operator`/`property` filter format is removed.

EntityType commands carry specifications and consequences evaluated during create and update operations; the runtime never evaluates code stored in the model.

Relationship properties create `relation-link` entities alongside their owner in the same transaction. When a property declares `reversePropertyId`, Poseidon also creates or removes the inverse link, so both relationship directions remain queryable without duplicating values into entity data. These are ordinary event-sourced projections, not a special persistence path.

### Command tracing and causal relationships

The proposed tracing direction records how a request produced its outcome, in addition to the mutation history. Capture the entry operation and input, the commands it invokes, their inputs and outputs or errors, evaluated branches, and resulting mutation events. Persisted events alone do not necessarily explain the entry request, reads, decisions, or external responses that led to a final state. Trace storage and retention are still to be designed; event sourcing does not by itself provide this execution record.

A correlation ID starts at request entry and follows the work caused by that request. If Poseidon later publishes to a queue or invokes an asynchronous listener, the message carries that ID and the consumer records receipt and subsequent work under it. Each operation and event also needs its own identity and a causation reference to its immediate trigger, allowing branches, retries, and parallel work to be distinguished. Correlation groups work; causation explains its relationships. These identifiers are diagnostic context, not authorization credentials or guarantees of delivery.

An independent external fact starts a new correlation. A carrier posting that a package was delivered starts a fresh request, and resulting delivery handling shares its correlation ID. The shipment ID relates that activity to the business record; it does not make delivery a continuation of the earlier order request. This is a more useful asynchronous boundary than separating order creation and stock reservation merely to introduce messaging: those operations can remain in one request when that meets the business need.

This design does not introduce a queue or durable event-listening framework into the current scope. If such consumers are later required, their delivery and completion contracts must be defined separately from correlation and from today's best-effort notifications.

### Regression tests from observed behaviour

The proposed direction is to derive regression scenarios from selected production execution traces. A scenario needs its original entry input, relevant starting records and permissions, the model/command versions involved, observed outcomes, and controlled sources of nondeterminism such as time, generated IDs, randomness, and external service responses. The capture mechanism must account for data read during execution; final mutation events alone are insufficient to reconstruct the starting fixture.

Replay invokes the original entry operation against the candidate definitions in an isolated test environment. Downstream internal commands execute again; their recorded outputs are expectations, not replacements for execution. External responses can be supplied from controlled fixtures. Where asynchronous consumers are involved, the runner must know when the scenario has completed and compare causal outcomes without demanding one arbitrary completion order for independent work. These replay and completion mechanisms remain to be implemented.

Avoid retaining every production execution as a separate test. The proposed grouping uses executed command paths, branches taken, and resulting events, retaining representative fixtures and meaningful boundary cases. Different customer names may be irrelevant to one flow; dates of birth may select different eligibility branches. Relevance must follow actual rules and observed decisions rather than a universal list of ignored fields. One trace per path is not exhaustive coverage: values near thresholds, failures, and interactions between values can matter even when the command sequence looks the same. The selection algorithm and capture/storage limits remain open.

Portal would run the retained regression suite against a candidate before promotion. AI may help curate scenarios and propose expectation changes when the intended business behaviour changes, such as removing a property or changing eligibility. A failing test must not simply rewrite its own expected output to match the candidate: each expectation change needs justification in the intended change, with user judgment where business intent is unclear. Captured production behaviour is evidence of a baseline, not proof that the old behaviour was correct or that all future cases are covered.

## UI execution boundary

The local UI prototype is explicitly enabled with `POSEIDON_LOCAL_UI=true`; production mode rejects this identity. The API binds to loopback and uses the existing server-owned `system` actor. Client-supplied actor IDs are never used. This is not authentication or access-control enforcement, and the generic entity API remains a development API.

`App`, `UIComponent`, `Theme`, `AppRelease`, and `conversation` are ordinary bootstrapped EntityTypes. Repository Portal sources seed missing component records only; changing a seed file does not overwrite a saved draft. The stored records become the source of truth after bootstrap.

A UIComponent contains TSX source (or a managed artifact ID), computed prop and event metadata, an optional theme ID, and declarative bindings. Components import one another using `@components/<id>` and compose with ordinary React props and callbacks. Poseidon derives props and callback events from the TypeScript contract whenever source is saved; clients cannot edit that metadata. The entry receives `onEvent(name, payload)`, which returns a promise, and passes callbacks to descendants as needed. Declarative bindings map bridge requests to server operations. Arbitrary API URLs and server-side JavaScript are not accepted.

The shell resolves an App and holds a release-pinned session. It renders one `allow-scripts allow-forms` iframe on `renderer.localhost`, without `allow-same-origin`. CSP blocks connections, external assets, nested frames, and native form submissions. A source-checked, protocol-versioned window handshake transfers a dedicated MessageChannel; event requests are correlated with promise results and timeouts. The server resolves bindings against the session's published snapshot. This boundary needs further adversarial validation before accepting untrusted authors, including self-navigation/exfiltration behavior; CSP is not a complete network firewall.

React Router lives in the authored tree. Memory routing sends navigation events to the shell, which validates the app base path and synchronizes browser history; browser navigation supplies route props back to the tree. The shell does not own page definitions.

### Portal UI context and actions

This is Portal application architecture rather than Poseidon core behavior. Every rendered page, form, dialog, and entity row runs within a standard UI context. The context is a structured property bag containing the current entity type, persisted entity when one exists, current form draft, and any additional input collected by the UI. Routes and entity-bound components establish the context; nested components inherit it, and forms or dialogs may extend it. UI elements do not inspect their surrounding page or define repeated mappings to rediscover the current entity.

UI actions describe client-side behavior and are separate from server commands. An action may navigate to a route, open a dialog component, or invoke an existing command. Navigation ends at the destination page, which receives the current context. A dialog receives the same context as its opener and may collect additional input. Buttons within the destination page or dialog may then invoke a command.

Invoking a command passes the current UI context to the API as one structured request. The target identifies the entity type and, when applicable, the entity ID and version; the draft contains edited entity data; and the input bag contains values collected specifically for the command. A delete button can therefore use the entity already present in its page context, while a save confirmation dialog can inherit the original entity and draft, add confirmation input, and pass the resulting context through unchanged. The server remains responsible for resolving and executing the named command; dialogs, navigation, and other presentation steps never enter or pause the server command pipeline.

#### Visual composition and exposed events

UI actions are an embedded Portal composition model, not Poseidon core entities. They provide the declarative equivalent of browser event handlers for the visual builder. Initially, an action navigates to a route, opens a dialog, invokes a Poseidon command, or sets a value in the current UI context; more action kinds should be added only for concrete visual-builder requirements.

```ts
type UIAction =
    | { type: 'navigate'; route: string }
    | { type: 'open-dialog'; componentId: string }
    | { type: 'execute-command'; commandName: string }
    | { type: 'set-value'; target: ValueTarget; value: UIExpression };
```

An exposed component event is an extension point that the visual builder can bind to one of these actions. For example, the standard reusable Button exposes `onClick` because it cannot know what each consumer wants it to do:

```json
{
    "componentId": "button",
    "props": {
        "label": "Delete"
    },
    "events": {
        "onClick": {
            "type": "open-dialog",
            "componentId": "confirm-delete"
        }
    }
}
```

Authored browser components remain the escape hatch for behavior that the declarative actions cannot express. Such a component handles the lower-level event internally instead of exposing it to the visual builder:

```tsx
function ComplexDeleteButton() {
    const context = useUIContext();

    async function handleClick() {
        // Arbitrary authored browser behavior using the current UI context.
    }

    return <Button onClick={handleClick}>Delete</Button>;
}
```

The custom component may expose a higher-level semantic event such as `onCompleted` when consumers still need an extension point. Therefore, exposed events are visually bindable to supported UI actions, internally handled events may use arbitrary authored browser code, and missing declarative behavior is implemented by composing or authoring a custom component.

`set-value` is the general visual-builder mechanism for connecting an event payload to form or page context. For example, a `CustomerPicker` may expose `onSelect(customer)` and bind the selected ID into a form field:

```json
{
    "type": "set-value",
    "target": {
        "scope": "form",
        "name": "customerId"
    },
    "value": {
        "from": "event",
        "path": "_id"
    }
}
```

Field-aware standard controls remain a convenience over the same context update: configuring a control with `field: "name"` lets it read that form value and update it through its ordinary change event without requiring the author to add an explicit action. Arbitrary exposed events use `set-value` when their payload must update form or page context.

The existing `UIBinding` implementation is not this visual event model. It currently maps named entry-component events to server bridge operations such as query, create, update, delete, navigation, publishing, and form submission. It should eventually be reviewed and either replaced by or separated clearly from Portal UI actions and data bindings.

#### Data sources and scopes

Queries are declarative UI data sources rather than UI actions. A data source belongs to any component instance in the visual composition tree; a page is simply the root component instance. Page-level sources coordinate or share results across sections, while a section may declare a source needed only within its subtree.

```ts
interface UIDataSource {
    type: 'query';
    entityTypeName: string;
    filter?: UIExpression;
    orderBy?: {
        property: string;
        direction: 'ascending' | 'descending';
    }[];
    limit?: number;
}
```

A parent may load multiple sources and bind their runtime state into ordinary child props:

```json
{
    "componentId": "customer-dashboard",
    "dataSources": {
        "customers": {
            "type": "query",
            "entityTypeName": "customer"
        },
        "orders": {
            "type": "query",
            "entityTypeName": "order"
        }
    },
    "children": [
        {
            "componentId": "customer-list",
            "props": {
                "items": {
                    "from": "data-source",
                    "source": "customers",
                    "path": "data"
                }
            }
        }
    ]
}
```

Each source exposes its loading, data, and error state. Reusable children normally receive results through prop bindings and therefore do not depend on page-specific source names.

Data sources use nested lexical scope. Every component instance creates a scope containing its local named sources and a reference to its parent scope. Resolution checks the nearest local source first and then walks outward. A child that declares its own `customers` source shadows only the ancestor's `customers`; it still inherits an ancestor's `orders`, and siblings continue to see the ancestor's `customers`. The builder may warn about shadowing, but it is valid and applies only to that subtree.

Reactive sources rerun when context values referenced by their query change. A search input can therefore use `set-value` to update `context.search`, while a customer source whose filter references that value reruns automatically. More complex data assembled from several entity types should initially use multiple named sources and component composition; business-sensitive or complex server-side aggregation belongs behind an explicit Poseidon API operation rather than expanding the visual query model into a backend language.

## UI compilation and releases

Git integration is not part of the selected authoring and promotion design. Component source can remain in Poseidon-managed records or artifacts, be edited and built in development, and move to production as the exact tested source revision and immutable build artifact. A separate build service does not require a Git repository or package registry. Git can be reconsidered for a concrete need such as external developer tooling, branching, or code review, rather than introduced solely for history already addressed by events and release records. Historical source still needs the applicable toolchain/dependency version if a build must be reproduced.

The same environment/promotion concept applies to stored command definitions, but it does not authorize executable user-written server code in the business runtime. Commands currently remain declarative. If authored server code becomes a requirement, its isolated execution service, permissions, build/version references, and interaction with Poseidon require a separate design; storing and promoting its source does not solve that execution boundary.

A release snapshots one revision of each component and theme reached from the App's entry component. Component dependencies are not stored or edited separately: the bundler resolves `@components/<id>` imports from the current component records and reports the IDs it actually loaded. Missing imports and cycles fail the build. Managed source and HTML artifacts use content hashes, never caller-provided filesystem paths. A Docker worker receives only a temporary build directory, with no network, credentials, writable root filesystem, or dependency installation; memory, CPU, process count and execution time are bounded. Its prebuilt image contains the curated React, Router, TypeScript, esbuild and Tailwind toolchain.

The worker checks imports and TypeScript, bundles a shared React runtime, scans component sources using Tailwind's scanner, and scopes theme CSS with `@scope`. Source diagnostics identify component IDs and lines. Authored JavaScript executes in the browser only; business rules remain declarative.

The Portal uses the curated `@poseidon/editor` helper for Monaco. Stored component sources become virtual TSX files; React, Router and Poseidon declarations are bundled with the compiler image. A local TypeScript worker reports syntax, type and import errors while editing. Any existing `@components/<id>` import is available without a second dependency declaration. The component list remains flat. No CDN or package downloads run in the browser: worker code is bundled into the release and runs through blob URLs, with `worker-src blob:` and embedded fonts permitted by the renderer CSP. Network connections remain blocked. Monaco's bundled TypeScript service provides editing feedback; the release compiler remains the authoritative build check.

Publishing stores an AppRelease before switching the App pointer with optimistic concurrency. A failed build leaves the previous release active. Existing sessions retain their snapshot until reload. The authoring screen exposes a flat component list, Monaco source editing, read-only prop/event metadata, diagnostics, publishing, and isolated previews. Source and name changes save automatically after one second of inactivity. Preview has no live queries or mutations.

## Forms

The React form controller shares draft values, dirty/touched state, validation errors and submission state within the iframe. Published form definitions separately declare input validation, derived expressions, and entity mappings. The server evaluates only literals, field references, conditionals, arithmetic, equality and string composition.

Form submissions validate all targets against a staged view, including references to later targets, before calling the existing transactional event store once. Defaults and declarative entity rules run through EntityService. Optimistic conflicts and invalid targets commit nothing. Direct field mappings translate entity validation problems back to form fields; complex derived-field errors currently use a form-level error. Forms are authored through component code and configuration; a visual form designer is not included. Browser tests exercise shared multistep drafts and failed-save recovery.

## Prototype delivery status

Home, simulated persisted Triton chat, responsive navigation, entity/property/relationship/action editing, component and theme authoring, previews, publishing and release restoration exercise real local persistence and compilation. Users and account screens expose local data; activity currently lists releases. Storybook documents controls, interaction states and light/dark tokens. Billing, external messaging, AI execution and real logout are not connected.

Remaining work includes broader accessibility and responsive coverage across every editor and long-content state, a complete design-system catalog, authoring polish, and further adversarial security testing. The current browser suite covers representative viewport sizes, chat/history, routing, publishing, preview, theme scopes, shared forms, mobile keyboard navigation and iframe boundaries; it is not a comprehensive security or accessibility audit. Production authentication, permission enforcement, deployment and artifact distribution remain deferred.

## Deferred architecture work

- Define App registration and authentication flows for browser, server, and public clients. Public operations must be explicitly exposed and protected independently of the public app identifier, with validation and throttling applied before expensive model or command processing.
- Consider app-level permissions for the proposed `App` entity and iframe bridge. The agreed authorization model is per user; a separate permission set for each app is not decided. Such a limit could require bridge requests to be allowed by both the current user and the app, reducing the access available to component code running for other users. Revisit the benefit and configuration complexity when designing the bridge.
- Replace direct post-commit notifications with Change Stream notifications from the `events` collection as described above. Notification failures must not trigger a compensating rollback of committed mutations; guaranteed consumer delivery is outside the current scope.
- Replace synchronous projection updates with durable asynchronous projection consumers only when a projection can safely be eventually consistent.
- That future projector must consume the stored event stream with checkpoints, idempotency, ordering, retries, and catch-up after restarts. It must not rely only on `EventEmitter`.
