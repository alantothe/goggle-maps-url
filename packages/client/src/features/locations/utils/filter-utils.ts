import type { Country } from "@client/shared/services/api/types";

/**
 * Convert country code to locationKey format (lowercase country name)
 * @param countryCode - Country code like "CO", "PE"
 * @param countries - Array of countries from API
 * @returns Lowercase country name like "colombia", "peru"
 */
export function countryCodeToLocationKey(
  countryCode: string,
  countries: Country[]
): string | null {
  const country = countries.find(c => c.code === countryCode);
  return country ? country.label.toLowerCase() : null;
}

/**
 * Truncate URL for display purposes while preserving full URL for copying
 * @param url - Full URL to truncate
 * @param maxLength - Maximum display length (default: 50)
 * @returns Truncated URL with ellipsis if needed
 */
export function truncateUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) {
    return url;
  }

  // Try to break at a reasonable point (after a parameter or before query string)
  const breakPoints = ['&', '?', '/'];
  let bestBreakPoint = maxLength;

  for (const breakPoint of breakPoints) {
    const index = url.lastIndexOf(breakPoint, maxLength);
    if (index > maxLength * 0.7) { // Only break if we're keeping at least 70% of maxLength
      bestBreakPoint = index + 1; // Include the break character
      break;
    }
  }

  return url.substring(0, bestBreakPoint) + '...';
}
