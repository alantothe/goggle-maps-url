import sharp from "sharp";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";

export interface ImageMetadata {
  width: number;
  height: number;
  size: number; // bytes
  format: string; // 'jpeg', 'png', 'webp', 'gif'
}

/**
 * Extract metadata from an image file using sharp
 */
export async function extractImageMetadata(filePath: string): Promise<ImageMetadata> {
  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats first
    const fileStats = await stat(filePath);

    // Extract image metadata using sharp
    const image = sharp(filePath);
    const metadata = await image.metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: fileStats.size,
      format: normalizeFormat(metadata.format),
    };
  } catch (error) {
    console.error(`Failed to extract metadata from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Normalize sharp format names to common format strings
 */
function normalizeFormat(format?: string): string {
  if (!format) return "unknown";

  const formatMap: Record<string, string> = {
    jpeg: "jpeg",
    jpg: "jpeg",
    png: "png",
    webp: "webp",
    gif: "gif",
    tiff: "tiff",
    avif: "avif",
  };

  return formatMap[format.toLowerCase()] || format.toLowerCase();
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
