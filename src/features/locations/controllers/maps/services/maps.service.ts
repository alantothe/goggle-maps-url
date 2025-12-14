import type { CreateMapsRequest, LocationEntry, UpdateMapsRequest } from "../../../models/location";
import {
  createFromMaps,
  generateGoogleMapsUrl,
  geocode,
} from "../../../services/location.helper";
import {
  getLocationById,
  saveLocation,
  updateLocationById,
} from "../../../repositories/location.repository";

const VALID_CATEGORIES = ["dining", "accommodations", "attractions", "nightlife"] as const;

export async function addMapsLocation(payload: CreateMapsRequest, apiKey?: string): Promise<LocationEntry> {
  if (!payload.name || !payload.address) {
    throw new Error("Name and address required");
  }

  const category = payload.category && VALID_CATEGORIES.includes(payload.category) ? payload.category : "attractions";

  const entry = await createFromMaps(payload.name, payload.address, apiKey, category, payload.dining_type);

  entry.title = payload.title;
  // Preserve Google-provided contact address unless user explicitly supplies one
  entry.contactAddress = payload.contactAddress ?? entry.contactAddress;
  entry.countryCode = payload.countryCode ?? entry.countryCode;
  // Prefer Google-provided phone/website unless client supplies overrides
  entry.phoneNumber = payload.phoneNumber ?? entry.phoneNumber;
  entry.website = payload.website ?? entry.website;
  entry.locationKey = payload.locationKey ?? entry.locationKey;

  saveLocation(entry);
  return entry;
}

export async function updateMapsLocation(payload: UpdateMapsRequest, apiKey?: string): Promise<LocationEntry> {
  if (!payload.id) {
    throw new Error("ID required");
  }

  if (!payload.title) {
    throw new Error("Display Title required");
  }

  const currentLocation = getLocationById(payload.id);
  if (!currentLocation || currentLocation.type !== "maps") {
    throw new Error("Location not found or cannot be edited");
  }

  const category = payload.category && VALID_CATEGORIES.includes(payload.category) ? payload.category : "attractions";

  let newUrl = currentLocation.url;
  let lat = currentLocation.lat;
  let lng = currentLocation.lng;
  let name = payload.name || currentLocation.name;
  let address = payload.address || currentLocation.address;
  let countryCode = currentLocation.countryCode;
  let locationKey = currentLocation.locationKey;

  if (payload.name && payload.address) {
    newUrl = generateGoogleMapsUrl(payload.name, payload.address);

    if (apiKey && payload.address !== currentLocation.address) {
      try {
        const coords = await geocode(payload.address, apiKey);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          if (coords.countryCode) {
            countryCode = coords.countryCode;
          }
          if (coords.locationKey) {
            locationKey = coords.locationKey;
          }
        }
      } catch (e) {
        console.warn("Failed to geocode updated address:", e);
      }
    }
  } else if (!payload.name && !payload.address) {
    name = currentLocation.name;
    address = currentLocation.address;
  }

  const success = updateLocationById(payload.id, {
    name,
    title: payload.title,
    address,
    category,
    dining_type: payload.dining_type,
    url: newUrl,
    lat,
    lng,
    contactAddress: payload.contactAddress,
    countryCode: payload.countryCode ?? countryCode,
    phoneNumber: payload.phoneNumber,
    website: payload.website,
    locationKey: payload.locationKey ?? locationKey,
  });

  if (!success) {
    throw new Error("Failed to update location");
  }

  const updatedLocation = getLocationById(payload.id);
  if (!updatedLocation) {
    throw new Error("Location not found after update");
  }

  return updatedLocation;
}
