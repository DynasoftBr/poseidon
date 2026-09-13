# Poseidon architecture

Poseidon is a self-describing business application runtime. Its own system entities and entities created by users share the same declarative model.

## Workspace

```text
projects/
  poseidon/server/             HTTP composition root
  packages/
    model/                     declarative entity and index types
    data-access/               MongoDB-only persistence implementation
    runtime/                   bootstrap, commands, queries, and projections
    service-utils/             logging and shared service infrastructure
```

`@poseidon/model` and `@poseidon/runtime` do not know MongoDB or HTTP. The server composes the runtime with the MongoDB implementation from `@poseidon/data-access`.

## Bootstrap

Server startup connects to MongoDB and idempotently creates any missing system user, core EntityTypes, EntityProperties, and Index definitions. This makes bootstrap additive when a new core model record is introduced. The bootstrap model is ordinary Poseidon model data.

## Event sourcing and projections

Poseidon uses one mutation model for all EntityTypes: commands append immutable events and projections materialize current documents for queries. The bootstrap is the first use of this path: it writes `entity-created` events and generic `entities` projections for the system user, core EntityTypes, properties, and indexes.

Initially, an event and its current-state projection will be written in the same MongoDB transaction. This provides atomic writes and immediate read-after-write consistency while keeping the first runtime small. An in-process `EventEmitter` may notify in-process consumers after that transaction commits; it is not an event store.

`EntityService` handles create, get, update, delete, and query for every EntityType, including `entity-type` and `entity-property`. `POST /api/v1/entities/:entityTypeId` accepts model-declared nested reference envelopes and commits their graph as one event/projection transaction. `GET`, `PATCH`, and `DELETE` use `/api/v1/entities/:entityTypeId/:id`; queries use `POST /api/v1/entities/:entityTypeId/query` with a declarative filter, offset, and limit. Nested entities infer their type from the reference property, are normalized to IDs in stored data, and never cause implicit deletion.

`Index` entities are reconciled to MongoDB indexes at startup and when their creation event is published. The Mongo index key always includes `entityTypeId`, so the generic `entities` collection can host independent indexes for every EntityType.

EntityType commands carry typed specifications and consequences. The runtime evaluates those declarative rules during create and update operations; it never evaluates code stored in the model.

Relationship properties create `relation-link` entities alongside their owner in the same transaction. When a property declares `reversePropertyId`, Poseidon also creates or removes the inverse link, so both relationship directions remain queryable without duplicating values into entity data. These are ordinary event-sourced projections, not a special persistence path.

## Deferred architecture work

- Replace the best-effort post-commit `EventEmitter` notification with durable outbox delivery. The mutation transaction must record delivery work with the event and projection; a worker must publish committed events, retain delivery state, and retry failures until downstream consumers can receive them. Event publication must never occur before the transaction commits or trigger a compensating rollback after commit.
- Replace synchronous projection updates with durable asynchronous projection consumers only when a projection can safely be eventually consistent.
- That future projector must consume the stored event stream with checkpoints, idempotency, ordering, retries, and catch-up after restarts. It must not rely only on `EventEmitter`.
