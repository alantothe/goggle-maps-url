/**
 * Files and images API service
 */

import { apiPost } from "./client";
import type { OpenFolderRequest, SuccessResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const filesApi = {
  /**
   * Open a folder in the system file explorer
   */
  async openFolder(folderPath: string): Promise<SuccessResponse> {
    const data: OpenFolderRequest = { folderPath };
    return apiPost<SuccessResponse>("/api/open-folder", data);
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
