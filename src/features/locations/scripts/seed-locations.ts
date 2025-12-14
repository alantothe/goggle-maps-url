#!/usr/bin/env bun

import { getDb, initDb } from '../../../shared/db/client';
import { countries } from '../../../data/locations';
import { generateLocationCombinations } from '../utils/location-utils';
import type { LocationHierarchy } from '../models/location';

/**
 * Seed the location hierarchy table with hierarchical location data
 */
function seedLocationHierarchy(): void {
  console.log("🌱 Seeding location hierarchy...");

  // Initialize database schema
  initDb();
  const db = getDb();
  const locations = generateLocationCombinations(countries);

  console.log(`📍 Generated ${locations.length} location combinations`);

  // Clear existing data
  db.run('DELETE FROM location_taxonomy');

  // Insert new data
  const insertQuery = db.query(`
    INSERT INTO location_taxonomy (country, city, neighborhood, location_key)
    VALUES ($country, $city, $neighborhood, $locationKey)
  `);

  locations.forEach(location => {
    try {
      insertQuery.run({
        $country: location.country,
        $city: location.city,
        $neighborhood: location.neighborhood,
        $locationKey: location.locationKey,
      });
    } catch (error) {
      console.error(`❌ Error inserting location ${location.locationKey}:`, error);
    }
  });

  console.log("✅ Location hierarchy seeded successfully!");
}

/**
 * Get all location hierarchy entries from database
 */
function getAllLocationHierarchy(): LocationHierarchy[] {
  const db = getDb();
  const query = db.query(`
    SELECT id, country, city, neighborhood, location_key as locationKey
    FROM location_taxonomy
    ORDER BY location_key
  `);

  return query.all() as LocationHierarchy[];
}

/**
 * Display seeded locations for verification
 */
function displaySeededLocations(): void {
  console.log('\n📋 Seeded Locations:');
  const locations = getAllLocationHierarchy();

  locations.forEach(location => {
    const displayName = location.locationKey.split('|').map(part =>
      part.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    ).join(' > ');

    console.log(`  ${location.locationKey} → ${displayName}`);
  });

  console.log(`\n📊 Total: ${locations.length} locations`);
}

// Run the seed script
if (import.meta.main) {
  try {
    seedLocationHierarchy();
    displaySeededLocations();
    console.log('\n🎉 Location seeding complete!');
  } catch (error) {
    console.error('💥 Error seeding locations:', error);
    process.exit(1);
  }
}

export { seedLocationHierarchy, getAllLocationHierarchy };
