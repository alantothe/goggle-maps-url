import type { Upload, ImageMetadata } from "../models/location";
import { BadRequestError, NotFoundError } from "@shared/errors/http-error";
import { ImageStorageService } from "@server/shared/services/storage/image-storage.service";
import { getLocationById } from "../repositories/location.repository";
import { saveUpload } from "../repositories/upload.repository";
import { createFromUpload } from "./location.helper";
import { extractImageMetadata } from "../utils/image-metadata-extractor";
import { join } from "node:path";

export class UploadsService {
  constructor(
    private readonly imageStorage: ImageStorageService
  ) {}

  async addUploadFiles(
    locationId: number,
    files: File[],
    photographerCredit?: string | null
  ): Promise<Upload> {
    if (!locationId) {
      throw new BadRequestError("Location ID required");
    }

    const parentLocation = getLocationById(locationId);
    if (!parentLocation) {
      throw new NotFoundError("Location", locationId);
    }

    if (!files || files.length === 0) {
      throw new BadRequestError("No files provided");
    }

    const timestamp = Date.now();
    const entry = createFromUpload(locationId, photographerCredit);
    const savedId = saveUpload(entry);

    if (typeof savedId === 'number') {
      entry.id = savedId;
    } else {
      throw new Error("Failed to save upload entry");
    }

    const storagePath = this.imageStorage.generateStoragePath({
      baseDir: this.imageStorage["baseImagesDir"],
      locationName: parentLocation.name,
      storageType: "uploads",
      timestamp
    });

    const { savedPaths, errors } = await this.imageStorage.saveUploadedFiles(
      files,
      storagePath
    );

    if (errors.length > 0) {
      console.warn("Some files failed to upload:", errors);
    }

    if (savedPaths.length > 0) {
      entry.images = savedPaths;

      // Extract metadata for each saved image
      const metadata: ImageMetadata[] = [];
      for (const path of savedPaths) {
        // Construct absolute path - savedPaths are relative to cwd
        const fullPath = join(process.cwd(), path);
        try {
          console.log(`Extracting metadata from: ${fullPath}`);
          const meta = await extractImageMetadata(fullPath);
          console.log(`Metadata extracted:`, meta);
          metadata.push(meta);
        } catch (error) {
          console.error(`Failed to extract metadata for ${path}:`, error);
          // Push default metadata on error
          metadata.push({
            width: 0,
            height: 0,
            size: 0,
            format: "unknown",
          });
        }
      }

      entry.imageMetadata = metadata;
      saveUpload(entry);
    }

    return entry;
  }
}
