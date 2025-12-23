/**
 * API feature barrel exports
 *
 * Usage:
 * import { locationsApi, hierarchyApi, filesApi } from "@/features/api";
 *
 * // Fetch locations
 * const { locations } = await locationsApi.getLocations({ category: "dining" });
 *
 * // Get countries for dropdown
 * const { countries } = await hierarchyApi.getCountries();
 *
 * // Get image URL
 * const imageUrl = filesApi.getImageUrl(location.uploads[0].images[0]);
 */

export { locationsApi } from "./locations.api";
export { hierarchyApi } from "./hierarchy.api";
export { filesApi } from "./files.api";

export { ApiError } from "./client";
export type { ApiResponse } from "./client";

export type * from "./types";
