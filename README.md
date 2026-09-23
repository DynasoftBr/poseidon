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

On startup, the server connects with `MONGODB_URI` without seeding model data; replacement initialization is still to be implemented. EntityProperties are embedded in each EntityType’s `properties` array.

An EntityType with `structure: true` describes embedded values and cannot be persisted independently. EntityProperty is a structure identified by its name within the owning EntityType.

The MVP has no authentication, actor context, or audit fields; requests can call the action endpoint directly.

The health check is available at `http://localhost:3000/health`.

## API smoke flow

This flow requires core EntityTypes to already exist in the database.

All business operations use `POST /:entityTypeName` with an action name and input object.

```bash
curl -X POST http://localhost:3000/entity-type \
  -H 'content-type: application/json' \
  -d '{"action":"save","input":{"_id":"person","name":"person","label":"Person","properties":[{"name":"name","type":"string","required":true}],"actions":[{"id":"save","name":"save","label":"save","enabled":true,"before":[]},{"id":"get","name":"get","label":"get","enabled":true,"before":[]},{"id":"delete","name":"delete","label":"delete","enabled":true,"before":[]},{"id":"validate","name":"validate","label":"validate","enabled":true,"before":[]}]}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"save","input":{"_id":"ada","name":"Ada Lovelace"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"get","input":{"_id":"ada"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"save","input":{"_id":"ada","_version":1,"name":"Ada Byron"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"validate","input":{"name":"Ada Byron"}}'

curl -X POST http://localhost:3000/person \
  -H 'content-type: application/json' \
  -d '{"action":"delete","input":{"_id":"ada"}}'
```

Entities are written directly without mutation events or projections. Relationship properties and implicit nested entity writes are removed; references use ordinary IDs, while embedded structures remain supported.

## JSDoc

Document public APIs with concise, multiline JSDoc. Include typed `@param` and `@returns` tags, use JSDoc syntax for optional parameters and defaults, describe async returns as `Promise<T>`, and add `@throws` for meaningful failures.

## Verification

```bash
npm run verify
npm run build
```
