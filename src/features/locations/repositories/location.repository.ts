import { getDb } from "../../../shared/db/client";
import type { LocationEntry } from "../models/location";
import { isLocationInScope } from "../utils/location-utils";

function mapRow(row: any): LocationEntry {
  return {
    ...row,
    contactAddress: row.contact_address || null,
    countryCode: row.country_code || null,
    phoneNumber: row.phone_number || null,
    website: row.website || null,
    instagram: row.instagram || null,
    images: row.images ? JSON.parse(row.images) : [],
    original_image_urls: row.original_image_urls ? JSON.parse(row.original_image_urls) : [],
    parent_id: row.parent_id || null,
    type: row.type || "maps",
    category: row.category || "attractions",
    dining_type: row.dining_type || null,
    locationKey: row.location_key || null,
  };
}

export function saveLocation(location: LocationEntry): number | boolean {
  try {
    const db = getDb();
    const query = db.query(`
      INSERT INTO location (name, title, address, url, embed_code, instagram, images, lat, lng, original_image_urls, parent_id, type, category, dining_type, location_key, contact_address, country_code, phone_number, website)
      VALUES ($name, $title, $address, $url, $embed_code, $instagram, $images, $lat, $lng, $original_image_urls, $parent_id, $type, $category, $dining_type, $location_key, $contact_address, $country_code, $phone_number, $website)
      ON CONFLICT(name, address) DO UPDATE SET
        title = excluded.title,
        url = excluded.url,
        embed_code = excluded.embed_code,
        instagram = excluded.instagram,
        images = excluded.images,
        lat = excluded.lat,
        lng = excluded.lng,
        original_image_urls = excluded.original_image_urls,
        parent_id = excluded.parent_id,
        type = excluded.type,
        category = excluded.category,
        dining_type = excluded.dining_type,
        location_key = excluded.location_key,
        contact_address = excluded.contact_address,
        country_code = excluded.country_code,
        phone_number = excluded.phone_number,
        website = excluded.website,
        created_at = CURRENT_TIMESTAMP
    `);

    query.run({
      $name: location.name,
      $title: location.title || null,
      $address: location.address,
      $url: location.url,
      $embed_code: location.embed_code || null,
      $instagram: location.instagram || null,
      $images: location.images ? JSON.stringify(location.images) : null,
      $lat: location.lat || null,
      $lng: location.lng || null,
      $original_image_urls: location.original_image_urls ? JSON.stringify(location.original_image_urls) : null,
      $parent_id: location.parent_id || null,
      $type: location.type || "maps",
      $category: location.category || "attractions",
      $dining_type: location.dining_type || null,
      $location_key: location.locationKey || null,
      $contact_address: location.contactAddress || null,
      $country_code: location.countryCode || null,
      $phone_number: location.phoneNumber || null,
      $website: location.website || null,
    });

    const result = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return result.id;
  } catch (error) {
    console.error("Error saving location to DB:", error);
    return false;
  }
}

export function updateLocationById(id: number, updates: Partial<LocationEntry>): boolean {
  try {
    const db = getDb();
    const setClause: string[] = [];
    const params: Record<string, unknown> = { $id: id };

    if (updates.name !== undefined) {
      setClause.push("name = $name");
      params.$name = updates.name;
    }
    if (updates.title !== undefined) {
      setClause.push("title = $title");
      params.$title = updates.title;
    }
    if (updates.address !== undefined) {
      setClause.push("address = $address");
      params.$address = updates.address;
    }
    if (updates.category !== undefined) {
      setClause.push("category = $category");
      params.$category = updates.category;
    }
    if (updates.dining_type !== undefined) {
      setClause.push("dining_type = $dining_type");
      params.$dining_type = updates.dining_type;
    }
    if (updates.url !== undefined) {
      setClause.push("url = $url");
      params.$url = updates.url;
    }
    if (updates.lat !== undefined) {
      setClause.push("lat = $lat");
      params.$lat = updates.lat;
    }
    if (updates.lng !== undefined) {
      setClause.push("lng = $lng");
      params.$lng = updates.lng;
    }
    if (updates.locationKey !== undefined) {
      setClause.push("location_key = $location_key");
      params.$location_key = updates.locationKey;
    }
    if (updates.contactAddress !== undefined) {
      setClause.push("contact_address = $contact_address");
      params.$contact_address = updates.contactAddress;
    }
    if (updates.countryCode !== undefined) {
      setClause.push("country_code = $country_code");
      params.$country_code = updates.countryCode;
    }
    if (updates.phoneNumber !== undefined) {
      setClause.push("phone_number = $phone_number");
      params.$phone_number = updates.phoneNumber;
    }
    if (updates.website !== undefined) {
      setClause.push("website = $website");
      params.$website = updates.website;
    }

    if (setClause.length === 0) {
      return false;
    }

    const query = db.query(`
      UPDATE location
      SET ${setClause.join(", ")}
      WHERE id = $id AND type = 'maps'
    `);

    (query as any).run(params);
    return true;
  } catch (error) {
    console.error("Error updating location:", error);
    return false;
  }
}

export function getAllLocations(): LocationEntry[] {
  const db = getDb();
  const query = db.query("SELECT id, name, title, address, url, embed_code, instagram, images, lat, lng, original_image_urls, parent_id, type, category, dining_type, location_key, contact_address, country_code, phone_number, website FROM location ORDER BY created_at DESC");
  const rows = query.all() as any[];
  return rows.map(mapRow);
}

export function getLocationById(id: number): LocationEntry | null {
  const db = getDb();
  const query = db.query("SELECT id, name, title, address, url, embed_code, instagram, images, lat, lng, original_image_urls, parent_id, type, category, dining_type, location_key, contact_address, country_code, phone_number, website FROM location WHERE id = $id");
  const row = query.get({ $id: id }) as any;
  if (!row) return null;
  return mapRow(row);
}

export function getLocationsByParentId(parentId: number): LocationEntry[] {
  const db = getDb();
  const query = db.query("SELECT id, name, title, address, url, embed_code, instagram, images, lat, lng, original_image_urls, parent_id, type, category, dining_type, location_key, contact_address, country_code, phone_number, website FROM location WHERE parent_id = $parentId ORDER BY created_at DESC");
  const rows = query.all({ $parentId: parentId }) as any[];
  return rows.map(mapRow);
}

export function clearDatabase() {
  try {
    const db = getDb();
    db.run("DELETE FROM location");
    db.run("VACUUM");
    return true;
  } catch (error) {
    console.error("Error clearing database:", error);
    return false;
  }
}


/**
 * Get locations by location scope (useful for cascading filters)
 */
export function getLocationsInScope(locationKey: string): LocationEntry[] {
  if (!locationKey) {
    return [];
  }

  const allLocations = getAllLocations();
  return allLocations.filter(
    (loc) => loc.locationKey && isLocationInScope(loc.locationKey, locationKey)
  );
}
