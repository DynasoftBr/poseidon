# Poseidon architecture

Poseidon is a self-describing business application runtime. Its own system entities and entities created by users share the same declarative model.

## Workspace

```text
projects/
  poseidon/server/             HTTP composition root
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

`@poseidon/models` and `@poseidon/runtime` do not know MongoDB or HTTP. The server composes the runtime with the MongoDB implementation from `@poseidon/data-access`.

All runtime entities use `Entity<TData>`: `id`, `entityTypeId`, `data`, `version`, and audit metadata. Core types specialize the same envelope with typed data; for example, an EntityProperty has `entityTypeId: 'entity-property'`, while `data.entityTypeId` identifies the type that owns the property. Bootstrap records use this representation directly, and MongoDB only maps `id` to `_id` at the persistence boundary.

EntityTypes are deliberately flat. The earlier `abstract` and `superTypeId` fields were removed because no current behavior required inheritance; shared behavior should remain explicit until a concrete use case justifies inheritance semantics.

## Bootstrap

Server startup connects to MongoDB and idempotently creates any missing system user, core EntityTypes, EntityProperties, and Index definitions. This makes bootstrap additive when a new core model record is introduced. The bootstrap model is ordinary Poseidon model data.

## Event sourcing and projections

Poseidon uses one mutation model for all EntityTypes: commands append immutable events and projections materialize current documents for queries. The bootstrap is the first use of this path: it writes `entity-created` events and generic `entities` projections for the system user, core EntityTypes, properties, and indexes.

Initially, an event and its current-state projection will be written in the same MongoDB transaction. This provides atomic writes and immediate read-after-write consistency while keeping the first runtime small. An in-process `EventEmitter` may notify in-process consumers after that transaction commits; it is not an event store.

`EntityService` handles create, get, update, delete, and query for every EntityType, including `entity-type` and `entity-property`. `POST /api/v1/entities/:entityTypeId` accepts model-declared nested reference envelopes and commits their graph as one event/projection transaction. `GET`, `PATCH`, and `DELETE` use `/api/v1/entities/:entityTypeId/:id`; queries use `POST /api/v1/entities/:entityTypeId/query` with a declarative filter, offset, and limit. Nested entities infer their type from the reference property, are normalized to IDs in stored data, and never cause implicit deletion.

`Index` entities are reconciled to MongoDB indexes at startup and when their creation event is published. The Mongo index key always includes `entityTypeId`, so the generic `entities` collection can host independent indexes for every EntityType.

Rules and query filters share `Specification`: comparisons address model property IDs and compose with `and`, `or`, and `not`. The runtime validates the full condition against the entity type, evaluates it for mutation rules, and passes the same condition and resolved property names to data access for MongoDB query translation; queries never execute rule consequences.

Comparison values are JSON scalars (strings, finite numbers, booleans, or null). Equality compares the whole field without coercion or implicit array membership; missing differs from null. `contains` means a case-sensitive literal substring for strings or exact scalar membership for arrays, without string coercion. Ordering requires numbers on both sides, and `exists` accepts a boolean and treats null as present. Empty `and` matches everything and empty `or` matches nothing. Invalid conditions or undeclared properties produce validation errors. The query filter wire format now uses the same `kind`/`propertyId` structure as rules; the former `operator`/`property` filter format is removed.

EntityType commands carry specifications and consequences evaluated during create and update operations; the runtime never evaluates code stored in the model.

Relationship properties create `relation-link` entities alongside their owner in the same transaction. When a property declares `reversePropertyId`, Poseidon also creates or removes the inverse link, so both relationship directions remain queryable without duplicating values into entity data. These are ordinary event-sourced projections, not a special persistence path.

## UI execution boundary

The local UI prototype is explicitly enabled with `POSEIDON_LOCAL_UI=true`; production mode rejects this identity. The API binds to loopback and uses the existing server-owned `system` actor. Client-supplied actor IDs are never used. This is not authentication or access-control enforcement, and the generic entity API remains a development API.

`App`, `UIComponent`, `Theme`, `AppRelease`, and `conversation` are ordinary bootstrapped EntityTypes. Repository Portal sources seed missing component records only; changing a seed file does not overwrite a saved draft. The stored records become the source of truth after bootstrap.

A UIComponent contains TSX source (or a managed artifact ID), computed prop and event metadata, an optional theme ID, and declarative bindings. Components import one another using `@components/<id>` and compose with ordinary React props and callbacks. Poseidon derives props and callback events from the TypeScript contract whenever source is saved; clients cannot edit that metadata. The entry receives `onEvent(name, payload)`, which returns a promise, and passes callbacks to descendants as needed. Declarative bindings map bridge requests to server operations. Arbitrary API URLs and server-side JavaScript are not accepted.

The shell resolves an App and holds a release-pinned session. It renders one `allow-scripts allow-forms` iframe on `renderer.localhost`, without `allow-same-origin`. CSP blocks connections, external assets, nested frames, and native form submissions. A source-checked, protocol-versioned window handshake transfers a dedicated MessageChannel; event requests are correlated with promise results and timeouts. The server resolves bindings against the session's published snapshot. This boundary needs further adversarial validation before accepting untrusted authors, including self-navigation/exfiltration behavior; CSP is not a complete network firewall.

React Router lives in the authored tree. Memory routing sends navigation events to the shell, which validates the app base path and synchronizes browser history; browser navigation supplies route props back to the tree. The shell does not own page definitions.

## UI compilation and releases

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

- Consider app-level permissions for the proposed `App` entity and iframe bridge. The agreed authorization model is per user; a separate permission set for each app is not decided. Such a limit could require bridge requests to be allowed by both the current user and the app, reducing the access available to component code running for other users. Revisit the benefit and configuration complexity when designing the bridge.
- Replace the best-effort post-commit `EventEmitter` notification with durable outbox delivery. The mutation transaction must record delivery work with the event and projection; a worker must publish committed events, retain delivery state, and retry failures until downstream consumers can receive them. Event publication must never occur before the transaction commits or trigger a compensating rollback after commit.
- Replace synchronous projection updates with durable asynchronous projection consumers only when a projection can safely be eventually consistent.
- That future projector must consume the stored event stream with checkpoints, idempotency, ordering, retries, and catch-up after restarts. It must not rely only on `EventEmitter`.
