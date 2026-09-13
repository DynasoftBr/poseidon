# Poseidon contributor guide

Poseidon is a self-describing business application runtime. The platform model is the source of truth: core entity types and user-created entity types use the same model.

## Scope

- Keep changes focused on the requested outcome.
- Follow the closest existing pattern before adding one.
- Keep `@poseidon/data-access` as the only package that knows MongoDB or Mongoose.
- Keep `@poseidon/model` free of persistence and transport concerns.
- Keep `@poseidon/runtime` free of MongoDB and HTTP concerns.
- Do not add executable user-defined code to the runtime. Model behaviour must remain declarative.

## Structure

- `projects/packages/model`: TypeScript interfaces for core Poseidon entity types and the declarative language.
- `projects/packages/data-access`: MongoDB connection and persistence models.
- `projects/packages/runtime`: validation, mutations, querying, index projection, model revisions, and bootstrap.
- `projects/packages/service-utils`: shared logging, configuration, and health-check utilities.
- `projects/poseidon/server`: HTTP composition root.

## TypeScript and testing

- Use strict TypeScript. Do not use `any`, `@ts-ignore`, or `@ts-expect-error`.
- Use kebab-case for non-React source files and folders.
- Add behaviour-focused Vitest tests for runtime and data-access changes.
- Run `npm run verify` from the repository root before declaring a code task complete.
- Run `npm run build` separately when production output changes.

## Git

- Commit messages use `<type>(<scope>): <subject>`.
