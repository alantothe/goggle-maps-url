import { getDb } from '../../../shared/db/client';
import type { LocationTaxonomy } from '../models/location';
import {
  filterCitiesByCountry,
  filterNeighborhoodsByCity,
  getCountries,
  isLocationInScope
} from '../utils/location-utils';

function mapTaxonomyRow(row: any): LocationTaxonomy {
  return {
    id: row.id,
    country: row.country,
    city: row.city,
    neighborhood: row.neighborhood,
    locationKey: row.location_key,
  };
}

/**
 * Get all location taxonomy entries
 */
export function getAllLocationTaxonomy(): LocationTaxonomy[] {
  const db = getDb();
  const query = db.query(`
    SELECT id, country, city, neighborhood, location_key
    FROM location_taxonomy
    ORDER BY location_key
  `);
  const rows = query.all() as any[];
  return rows.map(mapTaxonomyRow);
}

/**
 * Get location taxonomy by location key
 */
export function getLocationTaxonomyByKey(locationKey: string): LocationTaxonomy | null {
  const db = getDb();
  const query = db.query(`
    SELECT id, country, city, neighborhood, location_key
    FROM location_taxonomy
    WHERE location_key = $locationKey
  `);
  const row = query.get({ $locationKey: locationKey }) as any;
  return row ? mapTaxonomyRow(row) : null;
}

/**
 * Get all countries (location entries where city and neighborhood are null)
 */
export function getCountries(): LocationTaxonomy[] {
  const allLocations = getAllLocationTaxonomy();
  return allLocations.filter(loc => loc.city === null && loc.neighborhood === null);
}

/**
 * Get all cities for a specific country
 */
export function getCitiesByCountry(country: string): LocationTaxonomy[] {
  const allLocations = getAllLocationTaxonomy();
  return filterCitiesByCountry(allLocations, country);
}

/**
 * Get all neighborhoods for a specific city
 */
export function getNeighborhoodsByCity(country: string, city: string): LocationTaxonomy[] {
  const allLocations = getAllLocationTaxonomy();
  return filterNeighborhoodsByCity(allLocations, country, city);
}

/**
 * Get locations that match or are children of a parent location key
 * Useful for filtering related content (e.g., attractions in a city)
 */
export function getLocationsInScope(parentLocationKey: string): LocationTaxonomy[] {
  const allLocations = getAllLocationTaxonomy();
  return allLocations.filter(loc => isLocationInScope(loc.locationKey, parentLocationKey));
}

/**
 * Search locations by partial key match
 */
export function searchLocations(searchTerm: string): LocationTaxonomy[] {
  const allLocations = getAllLocationTaxonomy();
  const lowerSearchTerm = searchTerm.toLowerCase();

  return allLocations.filter(loc =>
    loc.locationKey.toLowerCase().includes(lowerSearchTerm) ||
    loc.country.toLowerCase().includes(lowerSearchTerm) ||
    (loc.city && loc.city.toLowerCase().includes(lowerSearchTerm)) ||
    (loc.neighborhood && loc.neighborhood.toLowerCase().includes(lowerSearchTerm))
  );
}

/**
 * Clear all location taxonomy data
 */
export function clearLocationTaxonomy(): boolean {
  try {
    const db = getDb();
    db.run('DELETE FROM location_taxonomy');
    return true;
  } catch (error) {
    console.error('Error clearing location taxonomy:', error);
    return false;
  }
}
