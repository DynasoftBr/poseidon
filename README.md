# Poseidon

Poseidon is a self-describing business application runtime. Its core entities and user-created entities are defined by the same model.

Read the [Poseidon Vision](./VISION.md) to understand the product philosophy and the standard every feature should be judged against.

## Local development

Use Node 20 and install the workspace dependencies once:

```bash
npm install
cp .env.example .env
```

Start MongoDB and the API in separate terminals:

```bash
npm run dev:infra
npm run dev
```

Or start both together:

```bash
npm run dev:stack
```

On startup, the server connects with `MONGODB_URI` and idempotently bootstraps Poseidon’s system user, core EntityTypes, and Index definitions. EntityProperties are embedded in each EntityType’s `properties` array. Existing separate property records are migrated into their owners before the old collection is removed.

An EntityType with `structure: true` describes embedded values and cannot be persisted independently or have its own collection indexes. EntityProperty is a structure; its `_id` identifies the property for model references, while version and audit metadata belong to the owning EntityType. Object properties and arrays of objects select their structure through `relatedEntityTypeId`.

Set `JWT_SECRET` to resolve `Authorization: Bearer` JWTs with a `userId` claim to stored user entities. Requests without a valid token continue with a null user, except when `POSEIDON_LOCAL_DEVELOPMENT=true` outside production: a missing token then resolves to the seeded `system` user. The action endpoint requires a resolved user; Poseidon does not yet issue tokens or enforce per-entity permissions.

The health check is available at `http://localhost:3000/health`.

## API smoke flow

All business operations use `POST /:entityTypeName` with an action name and input object. These examples assume the explicit local identity (`POSEIDON_LOCAL_DEVELOPMENT=true`); otherwise supply a valid Bearer token.

```bash
curl -X POST http://localhost:3000/entity-type \
  -H 'content-type: application/json' \
  -d '{"action":"create","input":{"_id":"person","name":"person","label":"Person","properties":[{"_id":"person:name","entityTypeId":"person","name":"name","type":"string","required":true}]}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"create","input":{"_id":"ada","name":"Ada Lovelace"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"query","input":{"filter":{"kind":"comparison","propertyId":"person:name","operator":"equals","value":"Ada Lovelace"}}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"get","input":{"_id":"ada"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"update","input":{"_id":"ada","_version":1,"name":"Ada Byron"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"validate","input":{"name":"Ada Byron"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"delete","input":{"_id":"ada"}}'
```

Entities are written directly without mutation events or projections. Relationship properties and implicit nested entity writes are removed; existing reference definitions migrate to ordinary IDs, while embedded structures remain supported.

## Verification

```bash
npm run verify
npm run build
```
