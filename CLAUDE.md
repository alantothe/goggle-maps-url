# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A location management API built with Bun and Hono that manages locations with Google Maps URLs, Instagram embeds, and uploaded images. Uses SQLite for persistence with a normalized three-table schema (`locations`, `instagram_embeds`, `uploads`) plus a separate location hierarchy/taxonomy system.

## Development Commands

**Run the server:**
```bash
bun start
# or
bun run src/server/main.ts
```
Server runs on `PORT=3000` by default. Set `GOOGLE_MAPS_API_KEY` and `RAPID_API_KEY` environment variables to enable geocoding and Instagram media downloads.

**Seed location hierarchy:**
```bash
bun run seed:locations
# or
bun run src/features/locations/scripts/seed-locations.ts
```

**Test location utilities:**
```bash
bun run test:locations
# or
bun run src/features/locations/scripts/test-location-utils.ts
```

**Test route handlers:**
```bash
bun run test-routes.ts
```
Mock Hono contexts to exercise controllers without hitting the network.

## Architecture

### Entry Point & Server
- `src/server/main.ts` starts the Bun/Hono server and initializes the database
- `src/shared/http/server.ts` exports the Hono `app` instance with global error handling via `app.onError()`
- Routes are auto-registered via side-effect imports in `src/features/locations/routes/location.routes.ts`
- Database initialized via `initDb()` which auto-migrates from old unified schema to new normalized schema if needed
- Global error handler catches all errors and returns standardized JSON responses

### Feature Organization
```
src/features/locations/
├── controllers/          # Thin HTTP handlers (consolidated files)
│   ├── locations.controller.ts       # GET /api/locations
│   ├── maps.controller.ts           # POST /api/add-maps, /api/update-maps
│   ├── instagram.controller.ts      # POST /api/add-instagram
│   ├── uploads.controller.ts        # POST /api/add-upload (multipart)
│   ├── files.controller.ts          # POST /api/open-folder, GET /src/data/images/*
│   ├── hierarchy.controller.ts      # GET /api/location-hierarchy/*
│   └── admin.controller.ts          # GET /api/clear-db
├── services/            # Business logic classes with dependency injection
│   ├── maps.service.ts
│   ├── instagram.service.ts
│   ├── uploads.service.ts
│   ├── location-query.service.ts
│   └── location.helper.ts
├── repositories/        # Database queries (separated by table)
│   ├── location.repository.ts
│   ├── instagram-embed.repository.ts
│   ├── upload.repository.ts
│   └── location-hierarchy.repository.ts
├── validation/          # Zod validation schemas
│   └── schemas/
│       ├── maps.schemas.ts
│       ├── instagram.schemas.ts
│       └── uploads.schemas.ts
├── container/           # Dependency injection container
│   └── service-container.ts
├── models/              # TypeScript types and interfaces
├── routes/              # Route registration (auto-imported by main.ts)
├── utils/               # Location parsing/formatting helpers
└── scripts/             # Runnable scripts (seed, test)
```

### Shared Code
```
src/shared/
├── http/                # Hono server instance with error handling
│   └── server.ts       # Exports app with onError() handler
├── db/                  # Database client and migrations
│   ├── client.ts       # initDb(), getDb(), closeDb()
│   └── migrations/      # Schema migration scripts
├── config/              # Environment configuration
│   └── env.config.ts   # Singleton EnvConfig service
├── core/                # Core infrastructure
│   ├── errors/         # Custom error classes
│   │   └── http-error.ts  # HttpError, BadRequestError, NotFoundError, ValidationError, etc.
│   ├── middleware/     # Hono middleware
│   │   └── validation.middleware.ts  # Zod validation middleware
│   └── types/          # Shared types
│       └── api-response.ts  # Standardized response types
├── services/            # Shared services
│   ├── storage/        # File storage
│   │   └── image-storage.service.ts  # ImageStorageService for uploads/downloads
│   └── external/       # External API clients
│       └── instagram-api.client.ts  # InstagramApiClient for RapidAPI
└── utils/               # Country codes and other utilities
```

### Data Storage
- `src/data/location.sqlite` - SQLite database
- `src/data/images/{location}/instagram/{timestamp}/` - Downloaded Instagram images
- `src/data/images/{location}/uploads/{timestamp}/` - Direct uploads
- `src/data/locations/` - Hierarchical TypeScript source data for location taxonomy

## Database Schema

### Normalized Tables (current)

**`locations`** - Main locations (formerly `type='maps'`)
- Primary table for restaurants, attractions, etc.
- Fields: `id`, `name`, `title`, `address`, `url`, `images`, `lat`, `lng`, `category`, `dining_type`, `locationKey`, `contactAddress`, `countryCode`, `phoneNumber`, `website`
- Unique constraint on `(name, address)`

**`instagram_embeds`** - Instagram posts linked to locations (formerly `type='instagram'`)
- Foreign key to `locations.id` via `location_id`
- Fields: `id`, `location_id`, `name`, `address`, `url`, `embed_code`, `instagram`, `images`, `original_image_urls`
- ON DELETE CASCADE

**`uploads`** - Directly uploaded images (formerly `type='upload'`)
- Foreign key to `locations.id` via `location_id`
- Fields: `id`, `location_id`, `name`, `address`, `url`, `images`
- ON DELETE CASCADE

**`location_taxonomy`** - Hierarchical location data (country → city → neighborhood)
- Fields: `id`, `country`, `city`, `neighborhood`, `locationKey` (pipe-delimited: `colombia|bogota|chapinero`)
- Unique constraint on `locationKey`

### Migration Strategy
The database auto-migrates from old unified `location` table (with `type` column) to new normalized schema on server start if old schema is detected. See `src/shared/db/migrations/split-location-tables.ts`.

## Location Hierarchy System

Uses pipe-delimited strings (`country|city|neighborhood`) stored in a flat table with all possible combinations pre-generated from hierarchical source data.

**Source data structure:**
```
src/data/locations/
├── index.ts                    # Exports all countries
├── colombia/
│   ├── index.ts               # Country definition
│   └── bogota/
│       └── neighborhoods.ts   # Array of neighborhood objects
└── peru/
    └── ...
```

**Adding new locations:**
1. Edit TypeScript files in `src/data/locations/{country}/{city}/neighborhoods.ts`
2. Update country index to include new city/neighborhood
3. Re-run `bun run seed:locations` to regenerate database

**Key utilities:**
- `parseLocationValue()` - Parse pipe-delimited string to object
- `formatLocationForDisplay()` - Format as "Colombia > Bogota > Chapinero"
- `filterCitiesByCountry()`, `filterNeighborhoodsByCity()` - Cascading filters
- `isLocationInScope()` - Check if location matches hierarchy scope

## Code Style

- TypeScript with ES modules; prefer async/await
- 2-space indentation, semicolons, double quotes
- `camelCase` for variables/functions, `PascalCase` for types/interfaces
- Kebab-case for filenames (`location-utils.ts`, `maps.service.ts`)
- Keep feature folders cohesive: controller → service → repository → model/util
- Avoid cross-feature imports unless shared

## Architecture Improvements (December 2025 Refactoring)

The codebase underwent a comprehensive refactoring to improve maintainability, type safety, and testability:

### Key Improvements

1. **Dependency Injection**: All services use constructor injection via `ServiceContainer`
   - Services are singletons managed by the container
   - Easy to mock for testing
   - Clear dependency graph

2. **Validation with Zod**: Request validation using Zod schemas
   - Type-safe validation with auto-generated TypeScript types
   - Centralized validation logic in `validation/schemas/`
   - Consistent error messages across endpoints

3. **Standardized Error Handling**: Custom error classes with proper HTTP status codes
   - `BadRequestError`, `NotFoundError`, `ValidationError`, etc.
   - Global error handler via `app.onError()` in `server.ts`
   - Consistent error response format: `{success: false, error: string, code: string, details?: any}`

4. **Eliminated Code Duplication**: Shared services extract common patterns
   - `ImageStorageService` handles all filesystem operations for images
   - `InstagramApiClient` encapsulates RapidAPI integration
   - `EnvConfig` centralizes environment variable access

5. **Improved Type Safety**: Reduced `any` types, proper error typing
   - DTOs generated from Zod schemas (`CreateMapsDto`, etc.)
   - Explicit error types instead of generic Error
   - Proper typing for all service methods

6. **Standardized Responses**: Consistent API response format
   - Success: `{success: true, data: {...}}`
   - Error: `{success: false, error: string, code?: string, details?: any}`
   - No more mixed response formats across endpoints

### Code Patterns to Follow

**Creating a new endpoint:**
1. Define Zod schema in `validation/schemas/`
2. Create controller function that uses `c.get("validatedBody")`
3. Service class method with DI dependencies
4. Apply `validateBody(schema)` middleware to route
5. Throw custom errors (e.g., `BadRequestError`) instead of generic errors

**Example controller pattern:**
```typescript
export async function postAddResource(c: Context) {
  const dto = c.get("validatedBody") as AddResourceDto;
  const entry = await container.resourceService.addResource(dto);
  return c.json(successResponse({ entry }));
}
```

**Example service pattern:**
```typescript
export class ResourceService {
  constructor(
    private readonly config: EnvConfig,
    private readonly storage: ImageStorageService
  ) {}

  async addResource(payload: AddResourceDto): Promise<Resource> {
    if (!payload.name) {
      throw new BadRequestError("Name required");
    }
    // Business logic here
  }
}
```

## API Patterns

**Controller responsibilities:**
- Parse and validate request body/params
- Call service layer for business logic
- Return JSON responses with `{ success: true, entry: {...} }` or `{ error: "..." }`

**Service responsibilities:**
- Business logic (e.g., geocoding, Instagram media download)
- Coordinate between multiple repositories
- Transform data between API and database formats

**Repository responsibilities:**
- Raw database queries using Bun SQLite
- Single table focus (one repository per table)
- Return database rows with minimal transformation

## Common Workflows

**Creating a maps location:**
1. POST `/api/add-maps` with `{ name, address }`
2. `maps.service.ts` geocodes via Google Maps API if key is set
3. `location.repository.ts` inserts into `locations` table
4. Returns full location object including lat/lng if geocoded

**Adding Instagram embed:**
1. POST `/api/add-instagram` with `{ embedCode, locationId }`
2. `instagram.service.ts` extracts permalink, downloads media via RapidAPI
3. `instagram-embed.repository.ts` inserts into `instagram_embeds` table
4. Images saved to `src/data/images/{location}/instagram/{timestamp}/`

**Updating location:**
1. POST `/api/update-maps` with `{ id, title, ... }`
2. If address changes and API key is set, re-geocode
3. `location.repository.ts` updates `locations` table
4. URL regenerated if name or address changed

**Querying locations:**
1. GET `/api/locations`
2. `location-query.service.ts` joins all three tables
3. Returns `locations` array with nested `instagram_embeds` and `uploads`

## Testing

- Run `bun run test:locations` after changing taxonomy helpers or location data
- Run `bun run test-routes.ts` when editing controllers or image serving
- For new logic, add lightweight Bun scripts near the feature with clear pass/fail output
- Validate API changes manually against `docs/url.md` while server runs

## Git Conventions

- Short, present-tense commit messages (e.g., "remove frontend", "reorder location fields")
- Scope commits to one behavior change
- Mention scripts run for verification
- Call out migrations to `location.sqlite` or folder layout changes in PRs
