# Repository Guidelines

## Project Structure & Module Organization
- `src/server/main.ts` starts the Bun/Hono server and wires shared middleware.
- `src/features/locations/` holds controllers, services, repositories, models, routes, utils, and runnable scripts for location and taxonomy workflows.
- `src/shared/` hosts reusable HTTP and DB helpers; data seeds and media live under `src/data/` (locations, images, taxonomy).
- `docs/url.md` documents HTTP endpoints; `dist/` is generated output; `test-routes.ts` is a smoke script for handlers.

## Build, Test, and Development Commands
- `bun install` — install dependencies.
- `bun start` or `bun run src/server/main.ts` — run the server (default `PORT=3000`). Set `GOOGLE_MAPS_API_KEY` to enable geocoding.
- `bun run src/features/locations/scripts/seed-locations.ts` — seed sample locations/taxonomy into SQLite.
- `bun run src/features/locations/scripts/test-location-utils.ts` — console checks for taxonomy helpers.
- `bun run test-routes.ts` — mock Hono contexts to exercise controllers without hitting the network.
- Data persists to `location.sqlite`; images and uploads write to `src/data/images/**`.

## Coding Style & Naming Conventions
- TypeScript with ES modules; prefer async/await and small, composable helpers.
- 2-space indentation, semicolons, and double quotes to match existing files.
- `camelCase` for variables/functions, `PascalCase` for types/interfaces, kebab-case for filenames (e.g., `location-utils.ts`).
- Keep feature folders cohesive: controller → service → repository → model/util; avoid cross-feature imports unless shared.

## Testing Guidelines
- Ensure `bun run src/features/locations/scripts/test-location-utils.ts` passes after changing taxonomy helpers or data.
- Run `bun run test-routes.ts` when editing controllers or image serving to confirm responses and status codes.
- For new logic, add lightweight Bun scripts near the feature; log clear pass/fail output similar to existing tests.
- Validate API changes manually against `docs/url.md` endpoints while the server runs.

## Commit & Pull Request Guidelines
- Use short, present-tense commit messages (e.g., "remove frontend", "reorder location fields").
- Keep commits scoped to one behavior change; mention scripts you ran for verification.
- PRs should summarize intent, linked issues, and API or data shape changes; add screenshots/GIFs for UI-facing tweaks.
- Call out migrations to `location.sqlite` or folder layout changes so reviewers can reproduce.
