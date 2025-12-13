import { jsonResponse, errorResponse } from "../../../shared/http/responses";
import {
  getAllLocationTaxonomy,
  getLocationTaxonomyByKey,
  getCountries as getCountriesFromRepo,
  getCitiesByCountry as getCitiesFromRepo,
  getNeighborhoodsByCity as getNeighborhoodsFromRepo,
  searchLocations,
} from "../repositories/location-taxonomy.repository";

/**
 * Get all location taxonomy entries
 */
export function getLocationTaxonomy() {
  try {
    const locations = getAllLocationTaxonomy();
    return jsonResponse({ locations });
  } catch (error) {
    console.error("Error fetching location taxonomy:", error);
    return errorResponse("Failed to fetch location taxonomy", 500);
  }
}

/**
 * Get all countries
 */
export function getCountries() {
  try {
    const countries = getCountriesFromRepo();
    return jsonResponse({ countries });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return errorResponse("Failed to fetch countries", 500);
  }
}

/**
 * Get cities for a specific country
 */
export function getCitiesByCountry(req: Request) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const country = pathParts[pathParts.length - 1]; // Extract country from URL
    console.log("getCitiesByCountry called with country:", country);

    if (!country) {
      return errorResponse("Country parameter required", 400);
    }

    const cities = getCitiesFromRepo(country);
    console.log("Found cities:", cities.length);
    return jsonResponse({ cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return errorResponse("Failed to fetch cities", 500);
  }
}

/**
 * Get neighborhoods for a specific city
 */
export function getNeighborhoodsByCity(req: Request) {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const country = pathParts[pathParts.length - 2]; // Extract country from URL
    const city = pathParts[pathParts.length - 1]; // Extract city from URL

    if (!country || !city) {
      return errorResponse("Country and city parameters required", 400);
    }

    const neighborhoods = getNeighborhoodsFromRepo(country, city);
    return jsonResponse({ neighborhoods });
  } catch (error) {
    console.error("Error fetching neighborhoods:", error);
    return errorResponse("Failed to fetch neighborhoods", 500);
  }
}
