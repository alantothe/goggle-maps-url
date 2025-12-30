/**
 * Image processing utilities for cropping and resizing images
 */

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TargetDimensions {
  width: number;
  height: number;
}

/**
 * Creates a cropped image from a source image using canvas
 * @param imageSrc - Source image URL (object URL or data URL)
 * @param cropData - Crop coordinates in pixels
 * @param targetDimensions - Target output dimensions
 * @param fileName - Output file name
 * @returns Cropped File object
 */
export async function createCroppedImage(
  imageSrc: string,
  cropData: CropData,
  targetDimensions: TargetDimensions,
  fileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      try {
        // Create canvas with exact target dimensions
        const canvas = document.createElement("canvas");
        canvas.width = targetDimensions.width;
        canvas.height = targetDimensions.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Draw cropped and scaled image
        ctx.drawImage(
          image,
          cropData.x,               // Source x
          cropData.y,               // Source y
          cropData.width,           // Source width
          cropData.height,          // Source height
          0,                        // Destination x
          0,                        // Destination y
          targetDimensions.width,   // Destination width (scaled)
          targetDimensions.height   // Destination height (scaled)
        );

        // Determine file type and quality
        const fileExtension = fileName.split(".").pop()?.toLowerCase();
        const mimeType = getMimeType(fileExtension || "jpg");
        const quality = mimeType === "image/png" ? 1.0 : 0.95;

        // Convert canvas to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob from canvas"));
              return;
            }

            // Create File object
            const file = new File([blob], fileName, { type: mimeType });
            resolve(file);
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    image.src = imageSrc;
  });
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeTypes[extension] || "image/jpeg";
}

/**
 * Load an image and return its dimensions
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Validate if an image meets minimum resolution requirements
 */
export async function validateImageResolution(
  file: File,
  minWidth: number,
  minHeight: number
): Promise<{ valid: boolean; error?: string; dimensions?: { width: number; height: number } }> {
  try {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);

    const dimensions = { width: img.naturalWidth, height: img.naturalHeight };

    if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
      return {
        valid: false,
        error: `Image resolution too low. Minimum: ${minWidth}×${minHeight}px, Got: ${img.naturalWidth}×${img.naturalHeight}px`,
        dimensions,
      };
    }

    return { valid: true, dimensions };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to validate image",
    };
  }
}
