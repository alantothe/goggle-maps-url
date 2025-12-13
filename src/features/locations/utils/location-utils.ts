import type { LocationTaxonomy, CountryData, CityData, NeighborhoodData } from '../models/location';

/**
 * Parse a pipe-delimited location key into its components
 * @param locationKey - Pipe-delimited string like "colombia|bogota|chapinero"
 * @returns Parsed location object or null if invalid
 */
export function parseLocationValue(locationKey: string): LocationTaxonomy | null {
  if (!locationKey || typeof locationKey !== 'string') {
    return null;
  }

  const parts = locationKey.split('|');
  if (parts.length < 1 || parts.length > 3) {
    return null;
  }

  const [country, city, neighborhood] = parts;

  return {
    country,
    city: city || null,
    neighborhood: neighborhood || null,
    locationKey,
  };
}

/**
 * Format a location object for display (human-readable)
 * @param locationKey - Pipe-delimited location key
 * @returns Formatted display string like "Colombia > Bogota > Chapinero"
 */
export function formatLocationForDisplay(locationKey: string): string {
  const parsed = parseLocationValue(locationKey);
  if (!parsed) return locationKey;

  const parts: string[] = [];

  // Add country display name
  parts.push(formatLocationName(parsed.country));

  if (parsed.city) {
    parts.push(formatLocationName(parsed.city));
  }

  if (parsed.neighborhood) {
    parts.push(formatLocationName(parsed.neighborhood));
  }

  return parts.join(' > ');
}

/**
 * Format a location slug/name for display (convert kebab-case to Title Case)
 * @param slug - Slug like "santa-teresita"
 * @returns Display name like "Santa Teresita"
 */
export function formatLocationName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Filter locations to get all cities for a specific country
 * @param locations - Array of location taxonomy entries
 * @param country - Country code like "colombia"
 * @returns Array of city locations (country|city combinations)
 */
export function filterCitiesByCountry(locations: LocationTaxonomy[], country: string): LocationTaxonomy[] {
  return locations.filter(loc =>
    loc.country === country &&
    loc.city !== null &&
    loc.neighborhood === null
  );
}

/**
 * Filter locations to get all neighborhoods for a specific city
 * @param locations - Array of location taxonomy entries
 * @param country - Country code like "colombia"
 * @param city - City value like "bogota"
 * @returns Array of neighborhood locations (country|city|neighborhood combinations)
 */
export function filterNeighborhoodsByCity(locations: LocationTaxonomy[], country: string, city: string): LocationTaxonomy[] {
  return locations.filter(loc =>
    loc.country === country &&
    loc.city === city &&
    loc.neighborhood !== null
  );
}

/**
 * Get countries from location taxonomy (unique country entries)
 * @param locations - Array of location taxonomy entries
 * @returns Array of unique country locations
 */
export function getCountries(locations: LocationTaxonomy[]): LocationTaxonomy[] {
  const countryMap = new Map<string, LocationTaxonomy>();

  locations.forEach(loc => {
    if (loc.city === null && loc.neighborhood === null && !countryMap.has(loc.country)) {
      countryMap.set(loc.country, loc);
    }
  });

  return Array.from(countryMap.values());
}

/**
 * Check if a location key matches or is a child of another location key
 * Used for filtering related locations (e.g., attractions in a city)
 * @param locationKey - The location key to check
 * @param parentLocationKey - The parent location key to match against
 * @returns True if locationKey matches or is a child of parentLocationKey
 */
export function isLocationInScope(locationKey: string, parentLocationKey: string): boolean {
  if (locationKey === parentLocationKey) {
    return true;
  }

  // Check if locationKey starts with parentLocationKey (indicating it's a child)
  return locationKey.startsWith(parentLocationKey + '|');
}

/**
 * Generate all possible location combinations from hierarchical data
 * @param countries - Array of country data with cities and neighborhoods
 * @returns Array of all possible location taxonomy entries
 */
export function generateLocationCombinations(countries: CountryData[]): LocationTaxonomy[] {
  const locations: LocationTaxonomy[] = [];

  countries.forEach(country => {
    // Add country-only entry
    locations.push({
      country: country.code,
      city: null,
      neighborhood: null,
      locationKey: country.code,
    });

    country.cities.forEach(city => {
      // Add country|city entry
      locations.push({
        country: country.code,
        city: city.value,
        neighborhood: null,
        locationKey: `${country.code}|${city.value}`,
      });

      // Add country|city|neighborhood entries
      city.neighborhoods.forEach(neighborhood => {
        locations.push({
          country: country.code,
          city: city.value,
          neighborhood: neighborhood.value,
          locationKey: `${country.code}|${city.value}|${neighborhood.value}`,
        });
      });
    });
  });

  return locations;
}

/**
 * Validate a location key format
 * @param locationKey - The location key to validate
 * @returns True if the location key is valid
 */
export function isValidLocationKey(locationKey: string): boolean {
  if (!locationKey || typeof locationKey !== 'string') {
    return false;
  }

  const parts = locationKey.split('|');
  return parts.length >= 1 && parts.length <= 3 && parts.every(part => part.length > 0);
}
