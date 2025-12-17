import type { CreateMapsRequest, Location, UpdateMapsRequest } from "../models/location";
import { BadRequestError, NotFoundError } from "../../../shared/core/errors/http-error";
import { EnvConfig } from "../../../shared/config/env.config";
import {
  createFromMaps,
  generateGoogleMapsUrl,
  geocode,
} from "./location.helper";
import {
  getLocationById,
  saveLocation,
  updateLocationById,
} from "../repositories/location.repository";
import { validateCategory, validateCategoryWithDefault } from "../utils/category-utils";

export class MapsService {
  constructor(
    private readonly config: EnvConfig
  ) {}

  async addMapsLocation(payload: CreateMapsRequest): Promise<Location> {
    if (!payload.name || !payload.address) {
      throw new BadRequestError("Name and address required");
    }

    // Validate category
    const category = validateCategory(payload.category);

    const apiKey = this.config.hasGoogleMapsKey() ? this.config.GOOGLE_MAPS_API_KEY : undefined;
    const entry = await createFromMaps(payload.name, payload.address, apiKey, category);

    saveLocation(entry);
    return entry;
  }

  async updateMapsLocation(payload: UpdateMapsRequest): Promise<Location> {
    if (!payload.id) {
      throw new BadRequestError("ID required");
    }

    if (!payload.title) {
      throw new BadRequestError("Display Title required");
    }

    const currentLocation = getLocationById(payload.id);
    if (!currentLocation) {
      throw new NotFoundError("Location", payload.id);
    }

    // Validate category or default to "attractions" if not provided
    const category = validateCategoryWithDefault(payload.category);

    let newUrl = currentLocation.url;
    let lat = currentLocation.lat;
    let lng = currentLocation.lng;
    let name = payload.name || currentLocation.name;
    let address = payload.address || currentLocation.address;
    let countryCode = currentLocation.countryCode;
    let locationKey = currentLocation.locationKey;

    if (payload.name && payload.address) {
      newUrl = generateGoogleMapsUrl(payload.name, payload.address);

      if (this.config.hasGoogleMapsKey() && payload.address !== currentLocation.address) {
        try {
          const coords = await geocode(payload.address, this.config.GOOGLE_MAPS_API_KEY);
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
      throw new NotFoundError("Location", payload.id);
    }

    return updatedLocation;
  }
}
