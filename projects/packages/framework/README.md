# @poseidon/framework

Declare Poseidon model definitions with decorated classes and apply them through a configured `PoseidonContext` using ordinary entity operations.

Enable `experimentalDecorators: true` in the consuming TypeScript project's compiler options. Decorators collect metadata at runtime, without constructing entity instances or requiring a compiler plugin. Property types and constraints must be explicit; TypeScript field types alone are not runtime metadata.

```ts
import { Entity, EntityTypeDef, Property, poseidon } from '@poseidon/framework';

@EntityTypeDef({ label: 'Customer' })
class Customer extends Entity {
    @Property({ type: 'string', required: true, minLength: 1 })
    name!: string;

    @Property({ type: 'integer', minimum: 0 })
    age!: number;
}

const model = poseidon.model();
model.entity(Customer);
await model.apply();
```

`entity()` is chainable and accepts decorated classes only. Each `model()` call starts an independent builder. Registering the same class twice is a no-op; declaring different classes with the same entity name fails.

Both `@EntityTypeDef` and `@Property` accept an optional `description` explaining the type or field; it is included in the persisted definition.

Entity names default to the kebab-case class name and can be set with `@EntityTypeDef({ name: 'customer' })`. Labels default to the class name. `structure` is supported for embedded definitions. `@Property` accepts the existing EntityProperty options, including type, requiredness, defaults, constraints, conventions, and array item types. It applies to string-named instance properties; inherited decorated properties are included, with subclass property declarations overriding inherited metadata. Every registered class must have its own `@EntityTypeDef` decorator.

Array item types can reference a decorated class, for example `@Property({ type: 'array', itemsType: EntityProperty })`. The builder stores the referenced entity-type ID, and runtime validation loads that definition to validate each item. Add referenced classes to the model explicitly, such as `model.entity(EntityProperty).entity(Customer)`, unless their definitions already exist.

`Structure` is the base for embedded values. `Entity` extends it with `_id`, `_version`, `save()`, and `delete()`; `EntityType` extends `Entity`. Entity definitions inherit the `save` and `delete` actions. `@Action()` records additional methods and their ordered `before` actions.

## Applying definitions

Initialize the framework before creating the model. On the server, use the existing runtime context:

```ts
import { PoseidonContext, poseidon } from '@poseidon/framework';
import { Runtime } from '@poseidon/runtime';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

poseidon.initialize({
    context: new PoseidonContext(
        new Runtime(client),
        () => undefined,
    ),
});

const model = poseidon.model();
model.entity(Customer);
await model.apply();
```

`Runtime` executes actions and persists them through MongoDB. `PoseidonContext.execute(request)` dispatches actions through its transport. A model retains the context configured when it was created. Initialization is application setup, not a mechanism for switching between concurrent request identities.

`apply()` derives the collected EntityType definitions and sends one `entity-type` `applyDefinitions` action. Only the classes explicitly added to the builder are included; this does not automatically seed every system type.

The runtime owns comparison, merging, validation, and transactional persistence. Properties remain embedded in EntityType, matching the current model contract.

Action failures propagate. The context/runtime determines authorization, validation, and concurrency guarantees; this package does not add those guarantees.

The same contract can be implemented by a transport context, but an HTTP implementation is not included here. Rule decorators and build-time type extraction remain outside this version.
