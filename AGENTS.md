# Poseidon contributor guide

Poseidon is a self-describing business application runtime. The platform model is the source of truth: core entity types and user-created entity types use the same model.

You MUST read the [Poseidon Vision](./VISION.md) to understand the product philosophy and the standard every feature should be judged against.

## Scope

- Keep changes focused on the requested outcome.
- Keep this repository backend-only; do not add Portal, frontend packages, or browser build/test workflows.
- Implement only the basic required behavior first; add validation, conditions, and edge-case handling only when a concrete requirement calls for them.
- Follow the closest existing pattern before adding one.
- When one-off development migrations, tests, validations, or similar tasks are necessary, implement them temporarily, run them, and then discard their code and any supporting tests or startup hooks; do not retain them in the codebase.
- Keep `@poseidon/data-access` as the only package that knows MongoDB or Mongoose.
- Keep `@poseidon/models` free of persistence and transport concerns.
- Keep `@poseidon/runtime` free of MongoDB and HTTP concerns.
- Do not add executable user-defined code to the runtime. Model behaviour must remain declarative.

## Structure

- `projects/packages/models`: TypeScript interfaces for core Poseidon entity types and the declarative language. Entity types live in `src/entity-types`, one per file.
- Keep each entity type and its data shape in its own model file; do not group multiple entity types in a shared model file.
- `projects/packages/data-access`: MongoDB connection and persistence models.
- `projects/packages/runtime`: validation, mutations, querying, model revisions, and bootstrap.
- `projects/packages/service-utils`: shared logging, configuration, and health-check utilities.
- `projects/poseidon/server`: HTTP composition root.

## TypeScript and testing

- Use strict TypeScript. Do not use `any`, `@ts-ignore`, or `@ts-expect-error`.
- Never disable ESLint rules unless complying with a rule is genuinely impossible. In that exceptional case, disable only the specific line and include a comment explaining why; never use file-wide disables.
- Use kebab-case for non-React source files and folders.
- Add behaviour-focused Vitest tests for runtime and data-access changes.
- Run `npm run verify` from the repository root before declaring a code task complete.
- Run `npm run build` separately when production output changes.

## Git

- Commit messages use `<type>(<scope>): <subject>`.
