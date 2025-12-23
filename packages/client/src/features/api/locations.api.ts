/**
 * Location management API service
 */

import { apiGet, apiPost, apiPatch, apiPostFormData } from "./client";
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
} from "./types";

export const locationsApi = {
  /**
   * Get all locations with optional filters
   */
  async getLocations(params?: {
    category?: Category;
    locationKey?: string;
  }): Promise<LocationsResponse> {
    return apiGet<LocationsResponse>("/api/locations", params as Record<string, string>);
  },

  /**
   * Create a new maps location
   */
  async createMapsLocation(data: CreateMapsRequest): Promise<Location> {
    const response = await apiPost<LocationEntryResponse>("/api/add-maps", data);
    return response.entry;
  },

  /**
   * Update an existing maps location
   */
  async updateMapsLocation(
    id: number,
    data: UpdateMapsRequest
  ): Promise<Location> {
    return apiPatch<Location>(`/api/maps/${id}`, data);
  },

  /**
   * Add Instagram embed to a location
   */
  async addInstagramEmbed(
    locationId: number,
    data: AddInstagramRequest
  ): Promise<InstagramEmbedResponse["entry"]> {
    const response = await apiPost<InstagramEmbedResponse>(
      `/api/add-instagram/${locationId}`,
      data
    );
    return response.entry;
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
      `/api/add-upload/${locationId}`,
      formData
    );
    return response.entry;
  },

  /**
   * Clear the entire database
   */
  async clearDatabase(): Promise<SuccessResponse> {
    return apiGet<SuccessResponse>("/api/clear-db");
  },
};
