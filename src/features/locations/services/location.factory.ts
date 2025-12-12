import type { LocationCategory, LocationEntry, DiningType } from "../models/location";

export function generateGoogleMapsUrl(name: string, address: string): string {
  const query = `${name} ${address}`;
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
}

interface GeocodeResponse {
  status: string;
  results?: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

export async function geocode(address: string, apiKey?: string): Promise<{ lat: number; lng: number } | null> {
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data: GeocodeResponse = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

interface PlaceDetailsResult {
  name?: string;
  formatted_address?: string;
  website?: string;
  international_phone_number?: string;
  formatted_phone_number?: string;
}

interface PlacesApiResponse {
  status: string;
  results?: Array<{
    place_id: string;
  }>;
  result?: PlaceDetailsResult;
}

export async function getPlaceDetails(name: string, address: string, apiKey?: string): Promise<PlaceDetailsResult | null> {
  if (!apiKey) return null;

  try {
    // Use Places API Text Search to find the place
    const query = `${name} ${address}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json() as PlacesApiResponse;

    if (searchData.status === "OK" && searchData.results && searchData.results.length > 0) {
      const placeId = searchData.results[0].place_id;

      // Get detailed place information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,international_phone_number,formatted_phone_number&key=${apiKey}`;

      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json() as PlacesApiResponse;

      if (detailsData.status === "OK" && detailsData.result) {
        return detailsData.result;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}

export function extractInstagramData(html: string): { url: string | null; author: string | null } {
  const permalinkMatch = html.match(/data-instgrm-permalink="([^"]+)"/);
  let url = permalinkMatch ? permalinkMatch[1] : null;

  if (url && url.includes("?")) {
    url = url.split("?")[0];
  }

  const authorMatch = html.match(/A post shared by ([^<]+)/);
  const author = authorMatch ? authorMatch[1].trim() : null;

  return { url, author };
}

export function normalizeInstagram(author: string | null): string | null {
  if (!author) return null;
  let handle = author.replace(/A post shared by/gi, "").trim();
  handle = handle.split(/\s+/)[0];
  handle = handle.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  if (!handle) return null;
  return `https://www.instagram.com/${handle}/`;
}

export async function createFromMaps(
  name: string,
  address: string,
  apiKey?: string,
  category: LocationCategory = "attractions",
  dining_type?: DiningType | null
): Promise<LocationEntry> {
  const url = generateGoogleMapsUrl(name, address);
  const entry: LocationEntry = {
    name,
    address,
    url,
    embed_code: undefined,
    instagram: undefined,
    images: [],
    original_image_urls: [],
    lat: null,
    lng: null,
    parent_id: null,
    type: "maps",
    category,
    dining_type,
  };

  if (!apiKey) {
    return entry;
  }

  try {
    // First, get coordinates via geocoding
    const coords = await geocode(address, apiKey);
    if (coords) {
      entry.lat = coords.lat;
      entry.lng = coords.lng;
    }

    // Try to get additional place details using Places API
    try {
      const placeDetails = await getPlaceDetails(name, address, apiKey);
      if (placeDetails) {
        // Update with enhanced information from Places API
        if (placeDetails.formatted_address && !entry.title) {
          // Could use this for contact address or other fields
          entry.contactAddress = placeDetails.formatted_address;
        }
        if (placeDetails.name && placeDetails.name !== name) {
          // The official name might be different
          entry.name = placeDetails.name;
        }
        if (placeDetails.website) {
          entry.website = placeDetails.website;
        }
        if (placeDetails.international_phone_number) {
          entry.phoneNumber = placeDetails.international_phone_number;
        } else if (placeDetails.formatted_phone_number) {
          entry.phoneNumber = placeDetails.formatted_phone_number;
        }
      }
    } catch (placesError) {
      console.warn("Failed to fetch place details:", placesError);
      // Continue without place details - geocoding still worked
    }
  } catch (e) {
    console.warn("Failed to fetch coordinates in createFromMaps:", e);
  }

  return entry;
}

export function createFromInstagram(embedHtml: string, parentLocationId?: number): LocationEntry {
  const { author } = extractInstagramData(embedHtml);
  const name = author ? `${author}_${Date.now()}` : `Instagram_${Date.now()}`;
  const instaProfile = normalizeInstagram(author);

  return {
    name,
    address: "Instagram Embed",
    url: extractInstagramData(embedHtml).url || "",
    embed_code: embedHtml,
    instagram: instaProfile || undefined,
    images: [],
    original_image_urls: [],
    lat: null,
    lng: null,
    parent_id: parentLocationId || null,
    type: "instagram",
  };
}

export function createFromUpload(parentLocationId: number, timestamp?: number): LocationEntry {
  const ts = timestamp || Date.now();
  const name = `Upload ${ts}`;

  return {
    name,
    address: "Direct Upload",
    url: "",
    embed_code: undefined,
    instagram: undefined,
    images: [],
    original_image_urls: [],
    lat: null,
    lng: null,
    parent_id: parentLocationId,
    type: "upload",
  };
}
