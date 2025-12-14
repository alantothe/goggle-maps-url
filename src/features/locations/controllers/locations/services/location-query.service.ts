import type { LocationWithChildren } from "../../../models/location";
import { getAllLocations } from "../../../repositories/location.repository";

export function listLocations(): LocationWithChildren[] {
  const allLocations = getAllLocations();
  const mainLocations = allLocations.filter((loc) => loc.type === "maps" || !loc.parent_id);

  return mainLocations.map((loc) => {
    const instagramEmbeds = allLocations.filter((embed) => embed.parent_id === loc.id && embed.type === "instagram");
    const uploadEntries = allLocations.filter((entry) => entry.parent_id === loc.id && entry.type === "upload");

    return {
      ...loc,
      instagram_embeds: instagramEmbeds,
      uploads: uploadEntries,
    };
  });
}
