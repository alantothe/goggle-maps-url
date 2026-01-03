import type { LocationResponse } from "../../../models/location";
import type { PayloadApiClient } from "@server/shared/services/external/payload-api.client";
import { ImageStorageService } from "@server/shared/services/storage/image-storage.service";
import type { UploadedImagesResult } from "../types";
import { mapLocationKeyToPayloadLocation } from "../mappers";
import type { ImageVariantType } from "@url-util/shared";

/**
 * Upload images and create Instagram posts for a location
 * Returns separate arrays for gallery images and Instagram post IDs
 */
export async function uploadLocationImages(
  location: LocationResponse,
  payloadClient: PayloadApiClient,
  imageStorage: ImageStorageService
): Promise<UploadedImagesResult> {
  const galleryImageIds: string[] = [];
  const instagramPostIds: string[] = [];

  try {
    // Upload images using ImageSet format (multi-variant system)
    for (const upload of location.uploads) {
      // Only handle ImageSetUpload format
      if (upload.format === 'imageset' && upload.imageSet) {
        // ImageSet format: upload ONLY variants (skip source image)
        const imageSet = upload.imageSet;
        // Validate variants exist
        if (!imageSet.variants || imageSet.variants.length === 0) {
          console.warn(`⚠️  ImageSet ${imageSet.id} has no variants, skipping`);
          continue;
        }

          // Define standard variant order for consistent upload sequence
          const variantOrder: ImageVariantType[] = ['thumbnail', 'square', 'wide', 'portrait', 'hero'];

          // Upload each variant in standard order
          for (const variantType of variantOrder) {
            const variant = imageSet.variants.find(v => v.type === variantType);

            if (!variant) {
              console.warn(`⚠️  ImageSet ${imageSet.id} missing variant: ${variantType}`);
              continue; // Skip missing variant, proceed with others
            }

            try {
              const imageBuffer = await imageStorage.readImage(variant.path);
              const filename = variant.path.split("/").pop() || "image.jpg";

              // Use base alt text for all variants (no variant-specific descriptions)
              // Photographer credit is sent separately, not merged into altText
              const altText = imageSet.altText || `${location.title || location.source.name}`;

              console.log('🔍 [DEBUG] altText:', altText);
              console.log('🔍 [DEBUG] photographerCredit:', imageSet.photographerCredit);

              const mediaAssetId = await payloadClient.uploadImage(
                imageBuffer,
                filename,
                altText,
                {
                  location: mapLocationKeyToPayloadLocation(location.locationKey || undefined),
                  photographerCredit: imageSet.photographerCredit
                }
              );

              galleryImageIds.push(mediaAssetId);
            } catch (error) {
              console.warn(`⚠️  Failed to upload variant ${variantType} for ImageSet ${imageSet.id}:`, error);
              // Continue with remaining variants (graceful degradation)
            }
          }
      }
    }

    // Process Instagram embeds (FIRST image only + create post)
    for (const embed of location.instagram_embeds) {
      if (embed.images && embed.images.length > 0) {
        const previewImagePath = embed.images[0];
        if (!previewImagePath) continue; // Skip if no preview image

        let previewMediaAssetId: string | null = null;

        try {
          // Step 1: Upload ONLY first image as preview
          const imageBuffer = await imageStorage.readImage(previewImagePath);
          const filename = previewImagePath.split("/").pop() || "instagram.jpg";
          const altText = `Instagram post by ${embed.username} at ${location.title || location.source.name}`;

          previewMediaAssetId = await payloadClient.uploadImage(
            imageBuffer,
            filename,
            altText,
            {
              location: mapLocationKeyToPayloadLocation(location.locationKey || undefined)
            }
          );

          // Step 2: Create Instagram post with preview image
          const postTitle = createInstagramPostTitle(embed.username, location);
          const instagramPostId = await payloadClient.createInstagramPost({
            title: postTitle,
            embedCode: embed.embed_code,
            previewImage: previewMediaAssetId,
            status: "published",
          });

          instagramPostIds.push(instagramPostId);

        } catch (error) {
          if (previewMediaAssetId) {
            console.warn(
              `⚠️  Instagram post creation failed for ${embed.username}, ` +
              `but preview image was uploaded (MediaAsset: ${previewMediaAssetId})`
            );
          } else {
            console.warn(`⚠️  Failed to process Instagram embed for ${embed.username}:`, error);
          }
          // Continue with other embeds
        }
      }
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    // Return whatever we successfully processed
  }

  return { galleryImageIds, instagramPostIds };
}

/**
 * Create Instagram post title from username and location
 */
export function createInstagramPostTitle(username: string, location: LocationResponse): string {
  const locationName = location.title || location.source.name;
  const cleanUsername = username.replace(/^@/, "");
  return `@${cleanUsername} at ${locationName}`;
}
