# API Feature

Type-safe client-side API service layer for communicating with the backend server.

## Structure

```
api/
├── client.ts           # Base fetch configuration and error handling
├── types.ts            # TypeScript types for requests/responses
├── locations.api.ts    # Location management endpoints
├── hierarchy.api.ts    # Location hierarchy endpoints
├── files.api.ts        # File and image operations
└── index.ts            # Barrel exports
```

## Usage

### Import the API services

```typescript
import { locationsApi, hierarchyApi, filesApi } from "@/features/api";
```

### Location Management

```typescript
// Get all locations
const { locations, cwd } = await locationsApi.getLocations();

// Get filtered locations
const { locations } = await locationsApi.getLocations({
  category: "dining",
  locationKey: "colombia|bogota"
});

// Create a new location
const location = await locationsApi.createMapsLocation({
  name: "Restaurant Name",
  address: "123 Main St, City, Country",
  category: "dining",
  locationKey: "colombia|bogota|chapinero",
  title: "Display Title",
  phoneNumber: "+1 234-567-8900"
});

// Update a location
const updated = await locationsApi.updateMapsLocation(1, {
  title: "New Title",
  category: "attractions"
});

// Add Instagram embed
const embed = await locationsApi.addInstagramEmbed(1, {
  embedCode: '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/ABC123/">...</blockquote>'
});

// Upload files
const files = document.querySelector<HTMLInputElement>('#file-input')!.files!;
const upload = await locationsApi.uploadFiles(
  1,
  Array.from(files),
  "Photographer Name"
);

// Clear database (admin)
await locationsApi.clearDatabase();
```

### Location Hierarchy

```typescript
// Get all hierarchy data
const { locations } = await hierarchyApi.getAllHierarchy();

// Get countries for dropdown
const { countries } = await hierarchyApi.getCountries();

// Get cities by country
const { cities } = await hierarchyApi.getCitiesByCountry("colombia");

// Get neighborhoods
const { neighborhoods } = await hierarchyApi.getNeighborhoods(
  "colombia",
  "bogota"
);
```

### Files and Images

```typescript
// Open folder in system explorer
await filesApi.openFolder("/path/to/folder");

// Get image URL for display
const imageUrl = filesApi.getImageUrl(
  "src/data/images/location_name/uploads/1234567890/image_0.jpg"
);

// Use in img tag
<img src={filesApi.getImageUrl(upload.images[0])} alt="Location" />

// Preload image
await filesApi.preloadImage("src/data/images/...");
```

### Error Handling

All API calls throw `ApiError` on failure with structured error info:

```typescript
import { locationsApi, ApiError } from "@/features/api";

try {
  const location = await locationsApi.createMapsLocation(data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error (${error.status}):`, error.message);
    console.error("Code:", error.code);
    console.error("Details:", error.details);
  }
}
```

## Environment Variables

Configure the API base URL in your `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

Defaults to `http://localhost:3000` if not set.

## Type Safety

All API methods are fully typed with TypeScript. Import types as needed:

```typescript
import type { Location, Category, CreateMapsRequest } from "@/features/api";

const categories: Category[] = ["dining", "accommodations", "attractions", "nightlife"];

function handleLocation(location: Location) {
  console.log(location.title, location.contact.phoneNumber);
}
```
