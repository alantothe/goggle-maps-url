/**
 * Consolidated API service
 */

import { apiGet, apiPost, apiPatch, apiPostFormData, unwrapEntry } from "./client";
import { API_BASE_URL, API_ENDPOINTS } from "./config";
import type {
  LocationsResponse,
  LocationEntryResponse,
  Location,
  CreateMapsRequest,
  UpdateMapsRequest,
  AddInstagramRequest,
  InstagramEmbedResponse,
  UploadResponse,
  SuccessResponse,
  Category,
  LocationHierarchyResponse,
  CountriesResponse,
  CitiesResponse,
  NeighborhoodsResponse,
  OpenFolderRequest,
} from "./types";

// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

export const locationsApi = {
  /**
   * Get all locations with optional filters
   */
  async getLocations(params?: {
    category?: Category;
    locationKey?: string;
  }): Promise<LocationsResponse> {
    return apiGet<LocationsResponse>(API_ENDPOINTS.LOCATIONS, params as Record<string, string>);
  },

  /**
   * Create a new maps location
   */
  async createMapsLocation(data: CreateMapsRequest): Promise<Location> {
    const response = await apiPost<LocationEntryResponse>(API_ENDPOINTS.ADD_MAPS, data);
    return unwrapEntry(response);
  },

  /**
   * Update an existing maps location
   */
  async updateMapsLocation(
    id: number,
    data: UpdateMapsRequest
  ): Promise<Location> {
    return apiPatch<Location>(API_ENDPOINTS.UPDATE_MAPS(id), data);
  },

  /**
   * Add Instagram embed to a location
   */
  async addInstagramEmbed(
    locationId: number,
    data: AddInstagramRequest
  ): Promise<InstagramEmbedResponse["entry"]> {
    const response = await apiPost<InstagramEmbedResponse>(
      API_ENDPOINTS.ADD_INSTAGRAM(locationId),
      data
    );
    return unwrapEntry(response);
  },

  /**
   * Upload files to a location
   */
  async uploadFiles(
    locationId: number,
    files: File[],
    photographerCredit?: string
  ): Promise<UploadResponse["entry"]> {
    const formData = new FormData();

    if (photographerCredit) {
      formData.append("photographerCredit", photographerCredit);
    }

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await apiPostFormData<UploadResponse>(
      API_ENDPOINTS.ADD_UPLOAD(locationId),
      formData
    );
    return unwrapEntry(response);
  },

  /**
   * Clear the entire database
   */
  async clearDatabase(): Promise<SuccessResponse> {
    return apiGet<SuccessResponse>(API_ENDPOINTS.CLEAR_DB);
  },
};

// ============================================================================
// LOCATION HIERARCHY
// ============================================================================

export const hierarchyApi = {
  /**
   * Get all location hierarchy data
   */
  async getAllHierarchy(): Promise<LocationHierarchyResponse> {
    return apiGet<LocationHierarchyResponse>(API_ENDPOINTS.HIERARCHY);
  },

  /**
   * Get all countries with their cities and neighborhoods
   */
  async getCountries(): Promise<CountriesResponse> {
    return apiGet<CountriesResponse>(API_ENDPOINTS.COUNTRIES);
  },

  /**
   * Get cities for a specific country
   */
  async getCitiesByCountry(country: string): Promise<CitiesResponse> {
    return apiGet<CitiesResponse>(API_ENDPOINTS.CITIES(country));
  },

  /**
   * Get neighborhoods for a specific country and city
   */
  async getNeighborhoods(
    country: string,
    city: string
  ): Promise<NeighborhoodsResponse> {
    return apiGet<NeighborhoodsResponse>(
      API_ENDPOINTS.NEIGHBORHOODS(country, city)
    );
  },
};

// ============================================================================
// FILES & IMAGES
// ============================================================================

export const filesApi = {
  /**
   * Open a folder in the system file explorer
   */
  async openFolder(folderPath: string): Promise<SuccessResponse> {
    const data: OpenFolderRequest = { folderPath };
    return apiPost<SuccessResponse>(API_ENDPOINTS.OPEN_FOLDER, data);
  },

  /**
   * Get the full URL for an image path
   * @param imagePath - Relative path from server (e.g., "src/data/images/location/file.jpg")
   * @returns Full URL to access the image
   */
  getImageUrl(imagePath: string): string {
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
  },

  /**
   * Preload an image by creating an Image element
   * Useful for optimistic loading before display
   */
  async preloadImage(imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      img.src = this.getImageUrl(imagePath);
    });
  },
};
