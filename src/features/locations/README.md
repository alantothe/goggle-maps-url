# Location Taxonomy System

This feature implements a hierarchical location taxonomy system using pipe-delimited string storage for country → city → neighborhood relationships.

## Overview

The system uses a flat database table with all possible location combinations pre-generated from hierarchical source data. Location keys are stored as pipe-delimited strings (e.g., `colombia|bogota|chapinero`).

## Architecture

### Data Flow
1. **Source Data**: Hierarchical TypeScript files in `src/data/locations/`
2. **Seed Script**: Generates all location combinations and populates database
3. **Database**: Flat `location_taxonomy` table with indexed `location_key`
4. **API**: Repository functions for querying and filtering

### Database Schema

```sql
CREATE TABLE location_taxonomy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country TEXT NOT NULL,
  city TEXT,
  neighborhood TEXT,
  location_key TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### Seeding the Database

```bash
# Run the seed script
bun run seed:locations

# Or run directly
bun run src/features/locations/scripts/seed-locations.ts
```

### Testing Utilities

```bash
# Test all utility functions
bun run test:locations
```

### Using Location Utilities

```typescript
import {
  parseLocationValue,
  formatLocationForDisplay,
  filterCitiesByCountry,
  isLocationInScope
} from './utils/location-utils';

// Parse a location key
const location = parseLocationValue('colombia|bogota|chapinero');
// { country: 'colombia', city: 'bogota', neighborhood: 'chapinero', locationKey: 'colombia|bogota|chapinero' }

// Format for display
const display = formatLocationForDisplay('colombia|bogota|chapinero');
// "Colombia > Bogota > Chapinero"

// Filter locations
const cities = filterCitiesByCountry(allLocations, 'colombia');
const neighborhoods = filterNeighborhoodsByCity(allLocations, 'colombia', 'bogota');

// Check if location is in scope (for filtering related content)
const inScope = isLocationInScope('colombia|bogota|chapinero', 'colombia|bogota'); // true
```

### Using Repositories

```typescript
import { getAllLocationTaxonomy, getCitiesByCountry } from './repositories/location-taxonomy.repository';
import { getLocationsInScope } from './repositories/location.repository';

// Get all taxonomy entries
const allLocations = getAllLocationTaxonomy();

// Get cities for a country
const cities = getCitiesByCountry('colombia');

// Get locations within a scope (e.g., all attractions in Bogotá)
const bogotaAttractions = getLocationsInScope('colombia|bogota');
```

## Data Structure

### Source Data Format

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

### Adding New Locations

1. **Add neighborhood data**:
   ```typescript
   // src/data/locations/colombia/bogota/neighborhoods.ts
   export const neighborhoods = [
     { label: 'Chapinero', value: 'chapinero' },
     { label: 'New Neighborhood', value: 'new-neighborhood' }, // Add new
   ];
   ```

2. **Update country index**:
   ```typescript
   // src/data/locations/colombia/index.ts
   import { neighborhoods as bogotaNeighborhoods } from './bogota/neighborhoods';

   export const colombia = {
     code: 'colombia',
     label: 'Colombia',
     cities: [
       {
         label: 'Bogotá',
         value: 'bogota',
         neighborhoods: bogotaNeighborhoods,
       },
     ],
   };
   ```

3. **Re-seed database**:
   ```bash
   bun run seed:locations
   ```

## Key Features

- **Pipe-delimited keys**: Simple string format for storage and queries
- **Hierarchical source data**: Version-controlled, easy to review changes
- **Flat database**: Fast queries with indexed location keys
- **Cascading selection**: Country → City → Neighborhood dropdown flow
- **Scope-based filtering**: Automatically filter related content by location hierarchy
- **Utility functions**: Comprehensive parsing, formatting, and filtering tools

## Design Decisions

1. **Pipe-delimited vs JSON**: Pipe-delimited strings provide single indexed fields for fast queries and simple string matching
2. **Flat table vs relations**: Flat table with pre-generated combinations trades storage for query performance
3. **Source-driven seeding**: Version control for location data ensures consistency and prevents manual entry errors

## Current Coverage

- **Colombia**: 2 cities (Bogotá, Medellín), 7 neighborhoods
- **Peru**: 2 cities (Lima, Cusco), 5 neighborhoods
- **Total**: 18 location combinations in database
