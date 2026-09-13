# Poseidon

Poseidon is a self-describing business application runtime. Its core entities and user-created entities are defined by the same model.

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

On startup, the server connects with `MONGODB_URI` and idempotently bootstraps Poseidon’s system user, core EntityTypes, EntityProperties, and Index definitions. Bootstrap events and their generic entity projections are written in one MongoDB transaction. Existing bootstrap data is never overwritten.

The health check is available at `http://localhost:3000/health`.

## API smoke flow

Create an EntityType, then create records through that EntityType's own properties:

```bash
curl -X POST http://localhost:3000/api/v1/entity-types \
  -H 'content-type: application/json' \
  -d '{"id":"person","name":"Person","label":"Person","properties":[{"id":"person:name","name":"name","type":"string","required":true}]}'

curl -X POST http://localhost:3000/api/v1/entities/person \
  -H 'content-type: application/json' \
  -d '{"id":"ada","data":{"name":"Ada Lovelace"}}'

curl -X POST http://localhost:3000/api/v1/entities/person/query \
  -H 'content-type: application/json' \
  -d '{"filter":{"operator":"equals","property":"name","value":"Ada Lovelace"}}'

curl -X PATCH http://localhost:3000/api/v1/entities/person/ada \
  -H 'content-type: application/json' \
  -d '{"expectedVersion":1,"data":{"name":"Ada Byron"}}'

curl -X DELETE http://localhost:3000/api/v1/entities/person/ada \
  -H 'content-type: application/json' \
  -d '{"expectedVersion":2}'
```

## Verification

```bash
npm run verify
npm run build
```
