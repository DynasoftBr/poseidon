# Runtime entity-type rules

A runtime entity type extends its framework counterpart only when it needs a decorated override or a runtime implementation. Do not mirror framework properties merely to repeat their shape.

Keep metadata declarations in `@poseidon/framework` whenever both environments use the same definition. Runtime classes add only MongoDB-facing decorators or method implementations that the framework facade cannot provide.
