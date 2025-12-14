import type { LocationHierarchy } from "../../../models/location";
import {
  getAllLocationHierarchy,
  getCitiesByCountry,
  getCountries,
  getNeighborhoodsByCity,
} from "../../../repositories/location-hierarchy.repository";

export function listLocationHierarchy(): LocationHierarchy[] {
  return getAllLocationHierarchy();
}

export function listCountries(): LocationHierarchy[] {
  return getCountries();
}

export function listCitiesByCountry(country: string): LocationHierarchy[] {
  return getCitiesByCountry(country);
}

export function listNeighborhoodsByCity(country: string, city: string): LocationHierarchy[] {
  return getNeighborhoodsByCity(country, city);
}
