/**
 * Location hierarchy API service
 */

import { apiGet } from "./client";
import type {
  LocationHierarchyResponse,
  CountriesResponse,
  CitiesResponse,
  NeighborhoodsResponse,
} from "./types";

export const hierarchyApi = {
  /**
   * Get all location hierarchy data
   */
  async getAllHierarchy(): Promise<LocationHierarchyResponse> {
    return apiGet<LocationHierarchyResponse>("/api/location-hierarchy");
  },

  /**
   * Get all countries with their cities and neighborhoods
   */
  async getCountries(): Promise<CountriesResponse> {
    return apiGet<CountriesResponse>("/api/location-hierarchy/countries");
  },

  /**
   * Get cities for a specific country
   */
  async getCitiesByCountry(country: string): Promise<CitiesResponse> {
    return apiGet<CitiesResponse>(`/api/location-hierarchy/cities/${country}`);
  },

  /**
   * Get neighborhoods for a specific country and city
   */
  async getNeighborhoods(
    country: string,
    city: string
  ): Promise<NeighborhoodsResponse> {
    return apiGet<NeighborhoodsResponse>(
      `/api/location-hierarchy/neighborhoods/${country}/${city}`
    );
  },
};
