import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { AddInstagramRequest, LocationEntry } from "../../../models/location";
import { createFromInstagram, extractInstagramData } from "../../../services/location.helper";
import { getLocationById, saveLocation } from "../../../repositories/location.repository";

export async function addInstagramEmbed(payload: AddInstagramRequest): Promise<LocationEntry> {
  const { embedCode, locationId } = payload;
  if (!embedCode) {
    throw new Error("Embed code required");
  }
  if (!locationId) {
    throw new Error("Location ID required");
  }

  const parentLocation = getLocationById(locationId);
  if (!parentLocation) {
    throw new Error("Parent location not found");
  }

  const { url: instaUrl } = extractInstagramData(embedCode);
  if (!instaUrl) {
    throw new Error("Invalid embed code");
  }

  const entry = createFromInstagram(embedCode, locationId);
  const savedId = saveLocation(entry);

  const timestamp = Date.now();
  const cleanName = parentLocation.name.replace(/[^a-z0-9]/gi, "_").toLowerCase().substring(0, 30);
  const baseImagesDir = join(process.cwd(), "images");
  const locationDir = join(baseImagesDir, cleanName);
  const typeDir = join(locationDir, "instagram");
  const timestampDir = join(typeDir, timestamp.toString());

  try {
    const apiResponse = await fetch("https://instagram120.p.rapidapi.com/api/instagram/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
        "x-rapidapi-key": "3e4f70dd00mshb714e256435f6e3p15c503jsn0c5a2df22416",
      },
      body: JSON.stringify({ url: instaUrl }),
    });

    const data: any = await apiResponse.json();
    const imageUrls: string[] = [];

    const getBestUrl = (candidates: Array<{ url: string }> | undefined) => {
      if (!candidates || candidates.length === 0) return null;
      return candidates[0]!.url;
    };

    if (data && data.media) {
      if (data.media.carousel_media) {
        data.media.carousel_media.forEach((item: any) => {
          if (item.image_versions2 && item.image_versions2.candidates) {
            const url = getBestUrl(item.image_versions2.candidates);
            if (url) imageUrls.push(url);
          }
        });
      } else if (data.media.image_versions2 && data.media.image_versions2.candidates) {
        const url = getBestUrl(data.media.image_versions2.candidates);
        if (url) imageUrls.push(url);
      }
    }

    if (imageUrls.length === 0 && Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.pictureUrl) imageUrls.push(item.pictureUrl);
      });
    } else if (imageUrls.length === 0 && data && data.pictureUrl) {
      imageUrls.push(data.pictureUrl);
    }

    if (imageUrls.length > 0) {
      if (!existsSync(baseImagesDir)) await mkdir(baseImagesDir);
      if (!existsSync(locationDir)) await mkdir(locationDir);
      if (!existsSync(typeDir)) await mkdir(typeDir);
      if (!existsSync(timestampDir)) await mkdir(timestampDir);

      const savedPaths: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const imgUrl = imageUrls[i];
        try {
          const imgRes = await fetch(imgUrl!);
          if (!imgRes.ok) throw new Error(`Failed to fetch ${imgUrl}`);

          const filename = `image_${i}.jpg`;
          const filePath = join(timestampDir, filename);
          await Bun.write(filePath, await imgRes.blob());
          savedPaths.push(`src/data/images/${cleanName}/instagram/${timestamp}/${filename}`);
        } catch (err) {
          console.error(`Error downloading image ${i + 1}:`, err);
        }
      }

      if (savedPaths.length > 0) {
        entry.images = savedPaths;
        entry.original_image_urls = imageUrls;
        saveLocation(entry);
      }
    }
  } catch (error) {
    console.error("Error fetching from RapidAPI:", error);
  }

  if (typeof savedId === "number") {
    const saved = getLocationById(savedId);
    if (saved) return saved;
  }
  return entry;
}
