# URL Utility API Documentation

This document outlines all available API endpoints for the URL Utility application, which manages location data including maps locations, Instagram embeds, and uploaded images.

## Base URL
```
http://localhost:3000
```

## API Endpoints Glossary

### Location Management
- `GET /api/locations` - List all locations
- `POST /api/add-maps` - Create maps location
- `POST /api/update-maps` - Update maps location
- `POST /api/add-instagram` - Add Instagram embed
- `POST /api/add-upload` - Upload files
- `POST /api/open-folder` - Open system folder

### Location Hierarchy
- `GET /api/location-hierarchy` (and legacy `/api/location-taxonomy`) - All hierarchy data
- `GET /api/location-hierarchy/countries` - List countries
- `GET /api/location-hierarchy/cities/:country` - Cities by country
- `GET /api/location-hierarchy/neighborhoods/:country/:city` - Neighborhoods by city/country

### Static Files
- `GET /src/data/images/*` - Serve uploaded images

## Location Management Endpoints

### GET /api/locations
Retrieves all locations with their associated Instagram embeds and uploads.

**Response:**
```json
{
  "locations": [
    {
      "id": 1,
      "name": "Location Name",
      "title": "Display Title",
      "address": "123 Main St",
      "url": "https://maps.google.com/...",
      "embed_code": null,
      "instagram": null,
      "images": ["path/to/image.jpg"],
      "original_image_urls": ["https://..."],
      "lat": 40.7128,
      "lng": -74.0060,
      "parent_id": null,
      "type": "maps",
      "category": "dining",
      "dining_type": "restaurant",
      "contactAddress": "123 Main St, City, State",
      "countryCode": "+1",
      "phoneNumber": "555-1234",
      "website": "https://example.com",
      "locationKey": "country|city|neighborhood",
      "instagram_embeds": [...],
      "uploads": [...]
    }
  ],
  "cwd": "/current/working/directory"
}
```
- `instagram_embeds` and `uploads` only appear on parent `maps` locations.
- `cwd` reflects the server process working directory.

### POST /api/add-maps
Creates a new maps location entry.

**Request Body (JSON):**
```json
{
  "name": "Location Name",
  "address": "123 Main St, City, State, Country"
}
```

- Required: `name`, `address`
- Optional: none (any extra fields are rejected)
- Behavior: When `GOOGLE_MAPS_API_KEY` is set, the server geocodes the address and may populate `lat`, `lng`, `countryCode`, `locationKey`, `contactAddress`, `website`, and `phoneNumber` from Google responses. The response echoes every field stored for the created location. Without the key, geocoded fields remain null.

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": 1,
    "name": "Location Name",
    "title": "Display Title",
    "address": "123 Main St",
    "url": "https://maps.google.com/...",
    "embed_code": null,
    "instagram": null,
    "images": [],
    "original_image_urls": [],
    "lat": 40.7128,
    "lng": -74.0060,
    "parent_id": null,
    "type": "maps",
    "category": "dining",
    "dining_type": "restaurant",
    "contactAddress": "123 Main St, City, State",
    "countryCode": "+1",
    "phoneNumber": "555-1234",
    "website": "https://example.com",
    "locationKey": "country|city|neighborhood"
  }
}
```

### POST /api/update-maps
Updates an existing maps location entry.

**Request Body (JSON):**
```json
{
  "id": 1,
  "name": "Updated Location Name",
  "title": "Updated Display Title",
  "address": "Updated Address",
  "category": "dining|accommodations|attractions|nightlife",
  "dining_type": "restaurant|cafe|bar|etc",
  "contactAddress": "Updated contact address",
  "countryCode": "+1",
  "phoneNumber": "555-1234",
  "website": "https://example.com",
  "locationKey": "colombia|bogota|chapinero"
}
```

- Required: `id`, `title` (must be present even if unchanged)
- Optional: `name`, `address`, `category` (defaults to `attractions` if not one of the allowed categories), `dining_type`, `contactAddress`, `countryCode`, `phoneNumber`, `website`, `locationKey`.
- Behavior: The target entry must be a `maps` location. Supply both `name` and `address` together to regenerate the Google Maps URL; geocoding and coordinate updates only occur when the address changes and `GOOGLE_MAPS_API_KEY` is configured. Other fields are updated directly when provided.

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": 1,
    "name": "Updated Location Name",
    "title": "Updated Display Title",
    "address": "Updated Address",
    "url": "https://maps.google.com/...",
    "embed_code": null,
    "instagram": null,
    "images": [],
    "original_image_urls": [],
    "lat": 40.7128,
    "lng": -74.0060,
    "parent_id": null,
    "type": "maps",
    "category": "dining",
    "dining_type": "restaurant",
    "contactAddress": "Updated contact address",
    "countryCode": "+1",
    "phoneNumber": "555-1234",
    "website": "https://example.com",
    "locationKey": "country|city|neighborhood"
  }
}
```

### POST /api/add-instagram
Adds an Instagram embed to an existing location.

**Request Body (JSON):**
```json
{
  "embedCode": "<blockquote class=\"instagram-media\">...</blockquote>",
  "locationId": 1
}
```

- Required: `embedCode` (full Instagram embed HTML containing `data-instgrm-permalink`), `locationId` (an existing parent location)
- Optional: none
- Behavior: Creates a child entry of type `instagram` under the parent. The server attempts to download media via RapidAPI and writes files under `src/data/images/{location}/instagram/{timestamp}/image_{n}.jpg` (the returned `images` array contains these paths). If media download fails, the embed entry is still created without images.

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": 2,
    "name": "Instagram Embed",
    "title": null,
    "address": "",
    "url": "",
    "embed_code": "<blockquote class=\"instagram-media\">...</blockquote>",
    "instagram": null,
    "images": [],
    "original_image_urls": [],
    "lat": null,
    "lng": null,
    "parent_id": 1,
    "type": "instagram",
    "category": null,
    "dining_type": null,
    "contactAddress": null,
    "countryCode": null,
    "phoneNumber": null,
    "website": null,
    "locationKey": null
  }
}
```

### POST /api/add-upload
Uploads files to an existing location.

**Request Type:** `multipart/form-data`

**Form Fields:**
- Required: `locationId` or `parentId` (numeric ID of an existing location), `files` (one or more files)
- Validation: Only JPEG, PNG, WebP, and GIF files are accepted; max 10MB per file; max 50MB per request; up to 20 files per upload. An empty file list is rejected.
- Behavior: Files are stored under `src/data/images/{location}/uploads/{timestamp}/image_{n}.{ext}` and the saved paths are echoed in the response.

**Response:**
```json
{
  "success": true,
  "entry": {
    "id": 3,
    "name": "Uploaded Files",
    "title": null,
    "address": "",
    "url": "",
    "embed_code": null,
    "instagram": null,
    "images": ["path/to/uploaded/image.jpg"],
    "original_image_urls": [],
    "lat": null,
    "lng": null,
    "parent_id": 1,
    "type": "upload",
    "category": null,
    "dining_type": null,
    "contactAddress": null,
    "countryCode": null,
    "phoneNumber": null,
    "website": null,
    "locationKey": null
  }
}
```

### POST /api/open-folder
Opens a folder in the system's file explorer.

**Request Body:**
```json
{
  "folderPath": "/path/to/folder"
}
```

- Required: `folderPath` (path must resolve inside the server's working directory; absolute or escaping paths are rejected)

**Response:**
```json
{
  "success": true
}
```

## Location Hierarchy Endpoints

### GET /api/location-hierarchy (legacy: /api/location-taxonomy)
Retrieves all location hierarchy entries (countries, cities, neighborhoods).

**Response:**
```json
{
  "locations": [
    {
      "id": 1,
      "country": "colombia",
      "city": "bogota",
      "neighborhood": "chapinero",
      "locationKey": "colombia|bogota|chapinero"
    }
  ]
}
```

### GET /api/location-hierarchy/countries (legacy: /api/location-taxonomy/countries)
Retrieves all available countries.

**Response:**
```json
{
  "countries": [
    {
      "code": "CO",
      "label": "Colombia",
      "cities": [
        {
          "label": "Bogotá",
          "value": "bogota",
          "neighborhoods": [
            {
              "label": "Chapinero",
              "value": "chapinero"
            }
          ]
        }
      ]
    }
  ]
}
```

### GET /api/location-hierarchy/cities/:country (legacy: /api/location-taxonomy/cities/:country)
Retrieves all cities for a specific country.

**Parameters:**
- Required path param `country`: Country code/slug (e.g., "colombia", "peru")

**Example:** `GET /api/location-hierarchy/cities/colombia`

**Response:**
```json
{
  "cities": [
    {
      "label": "Bogotá",
      "value": "bogota",
      "neighborhoods": [
        {
          "label": "Chapinero",
          "value": "chapinero"
        }
      ]
    }
  ]
}
```

### GET /api/location-hierarchy/neighborhoods/:country/:city (legacy: /api/location-taxonomy/neighborhoods/:country/:city)
Retrieves all neighborhoods for a specific city and country.

**Parameters:**
- Required path params: `country` (e.g., "colombia"), `city` (e.g., "bogota")

**Example:** `GET /api/location-hierarchy/neighborhoods/colombia/bogota`

**Response:**
```json
{
  "neighborhoods": [
    {
      "label": "Chapinero",
      "value": "chapinero"
    }
  ]
}
```

## Static File Serving

### GET /src/data/images/*
Serves uploaded images and other static files from the data directory.

**Example:** `GET /src/data/images/uploads/123456789/image_0.jpg`

**Response:** Image file or 404 if not found

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing required fields)
- `404`: Not Found
- `500`: Internal Server Error

## Categories and Dining Types

### Location Categories
- `dining`
- `accommodations`
- `attractions`
- `nightlife`

### Dining Types
- `restaurant`, `fast-food`, `food-truck`, `cafe`, `bar`, `pub`
- `rooftop-bar`, `street-food`, `brewery`, `winery`, `seafood`
- `italian`, `american`, `wine-bar`, `cocktail-bar`, `dive-bar`
- `buffet`, `bakery`, `dessert`, `ice-cream`, `coffee-shop`
- `tea-shop`, `juice-bar`, `smoothie-bar`, `pizza`

## Environment Variables

- `GOOGLE_MAPS_API_KEY`: Required for geocoding functionality when adding/updating maps locations
- `PORT`: Server port (defaults to 3000)
