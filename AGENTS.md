# Poseidon contributor guide

Poseidon is a self-describing business application runtime. The platform model is the source of truth: core entity types and user-created entity types use the same model.

## Scope

- Keep changes focused on the requested outcome.
- Follow the closest existing pattern before adding one.
- Keep `@poseidon/data-access` as the only package that knows MongoDB or Mongoose.
- Keep `@poseidon/models` free of persistence and transport concerns.
- Keep `@poseidon/runtime` free of MongoDB and HTTP concerns.
- Do not add executable user-defined code to the runtime. Model behaviour must remain declarative.

## Structure

- `projects/packages/models`: TypeScript interfaces for core Poseidon entity types and the declarative language. Entity types live in `src/entity-types`, one per file.
- Keep each entity type and its data shape in its own model file; do not group multiple entity types in a shared model file.
- `projects/packages/data-access`: MongoDB connection and persistence models.
- `projects/packages/runtime`: validation, mutations, querying, index projection, model revisions, and bootstrap.
- `projects/packages/service-utils`: shared logging, configuration, and health-check utilities.
- `projects/poseidon/server`: HTTP composition root.
- `projects/packages/ui-platform`: UI model bootstrap, releases, managed artifacts, restricted compilation and atomic form mappings.
- `projects/packages/ui-foundation`: React controls, shared form state, Tailwind tokens and Storybook.
- `projects/poseidon/client`: trusted shell; keep business screens inside authored UIComponents.
- `projects/poseidon/portal`: additive seed sources for stored Portal components.

## TypeScript and testing

- Use strict TypeScript. Do not use `any`, `@ts-ignore`, or `@ts-expect-error`.
- Never disable ESLint rules unless complying with a rule is genuinely impossible. In that exceptional case, disable only the specific line and include a comment explaining why; never use file-wide disables.
- Use kebab-case for non-React source files and folders.
- Add behaviour-focused Vitest tests for runtime and data-access changes.
- Run `npm run verify` from the repository root before declaring a code task complete.
- Run `npm run build` separately when production output changes.

## Git

- Commit messages use `<type>(<scope>): <subject>`.

## UI boundary

- Authored React code is allowed only in UIComponent sources and the isolated browser renderer; never evaluate it in the business runtime or server.
- Keep component imports explicit and curated; build authored sources in the restricted Docker worker.
- Never overwrite stored drafts during bootstrap, mutate an AppRelease, or activate a failed build.
- The local UI identity requires `POSEIDON_LOCAL_UI=true` and is not production authentication; do not accept actor IDs from browser requests.
- Run the Storybook build and browser integration tests when changing UI behavior; see README for local setup.
- After implementing a Portal UI change, restart affected local services when they are already running, apply any required additive seed migration, publish a new release when the active release is stale, and verify that the active release contains the change.
- Refresh the open Portal when browser control is available so the result is ready for the user to verify; do not leave routine restart, republish, or refresh steps to the user.
