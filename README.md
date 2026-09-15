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

Set `JWT_SECRET` to resolve `Authorization: Bearer` JWTs with a `userId` claim to stored user entities. Requests without a valid token continue with a null user, except when `POSEIDON_LOCAL_UI=true` outside production: a missing token then resolves to the seeded `system` user. Poseidon does not issue tokens or restrict routes yet.

The health check is available at `http://localhost:3000/health`.

## API smoke flow

Create an EntityType and its properties through the same generic graph endpoint, then create records through that type:

```bash
curl -X POST http://localhost:3000/api/v1/entities/entity-type \
  -H 'content-type: application/json' \
  -d '{"id":"person","data":{"name":"Person","label":"Person","properties":[{"id":"person:name","data":{"entityTypeId":"person","name":"name","type":"string","required":true}}]}}'

curl -X POST http://localhost:3000/api/v1/entities/person \
  -H 'content-type: application/json' \
  -d '{"id":"ada","data":{"name":"Ada Lovelace"}}'

curl -X POST http://localhost:3000/api/v1/entities/person/query \
  -H 'content-type: application/json' \
  -d '{"filter":{"kind":"comparison","propertyId":"person:name","operator":"equals","value":"Ada Lovelace"}}'

curl http://localhost:3000/api/v1/entities/person/ada

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

## Local UI prototype

The local UI prototype includes stored Portal components, authoring, compilation and publishing; see remaining work in [ARCHITECTURE.md](ARCHITECTURE.md). Docker must be running and MongoDB must support transactions (a replica set).

Build packages and the restricted UI compiler image:

```bash
npm run build
docker build -t poseidon-ui-builder:local projects/packages/ui-platform/builder
```

Run the server with the explicit local identity, then the shell in a second terminal:

```bash
POSEIDON_LOCAL_UI=true npm run dev --workspace @poseidon/server
npm run dev --workspace @poseidon/client
```

Configure `MONGODB_URI` for the local replica set before starting. Open `http://127.0.0.1:5173`; the renderer is served separately on `http://renderer.localhost:3001`. Ports 3000, 3001 and 5173 must be free. The UI server binds only to loopback. Production mode rejects the development identity.

On first launch, Portal sources and the Default theme are stored as ordinary entities and published through the compiler. Existing records are never overwritten on subsequent launches. Edit stored sources through Components; changes save automatically after one second of inactivity. The server derives component props and events from TypeScript during each save. Compiler artifacts are stored in the server working directory's ignored `.poseidon-artifacts` folder, or `POSEIDON_ARTIFACT_DIRECTORY`.

The chat is explicitly simulated but persists conversations. Billing, real authentication/logout, external messaging and live AI are not connected.

Additional UI checks:

```bash
npm run storybook:build --workspace @poseidon/ui-foundation
npm run e2e --workspace @poseidon/client
```

Browser tests use installed Google Chrome and start their own server, Vite shell and disposable MongoDB replica set. The isolated database is bootstrapped on startup and removed after the run.
