#!/usr/bin/env bun

import { countries } from '../../../data/locations';
import {
  generateLocationCombinations,
  parseLocationValue,
  formatLocationForDisplay,
  formatLocationName,
  filterCitiesByCountry,
  filterNeighborhoodsByCity,
  getCountries,
  isLocationInScope
} from '../utils/location-utils';

console.log('🧪 Testing Location Taxonomy Utilities\n');

// Test data generation
console.log('1. 📊 Generated Location Combinations:');
const locations = generateLocationCombinations(countries);
locations.forEach(loc => {
  console.log(`   ${loc.locationKey}`);
});
console.log(`   Total: ${locations.length} locations\n`);

// Test parsing
console.log('2. 🔍 Location Parsing:');
const testKeys = ['colombia', 'colombia|bogota', 'colombia|bogota|chapinero'];
testKeys.forEach(key => {
  const parsed = parseLocationValue(key);
  console.log(`   "${key}" → ${JSON.stringify(parsed)}`);
});
console.log();

// Test formatting
console.log('3. 🎨 Display Formatting:');
testKeys.forEach(key => {
  const display = formatLocationForDisplay(key);
  console.log(`   "${key}" → "${display}"`);
});
console.log();

// Test name formatting
console.log('4. 📝 Name Formatting:');
const slugs = ['santa-teresita', 'el-poblado', 'san-blas'];
slugs.forEach(slug => {
  const formatted = formatLocationName(slug);
  console.log(`   "${slug}" → "${formatted}"`);
});
console.log();

// Test filtering
console.log('5. 🔎 Location Filtering:');
console.log('   Cities in Colombia:');
const colombiaCities = filterCitiesByCountry(locations, 'colombia');
colombiaCities.forEach(city => {
  console.log(`     ${city.locationKey}`);
});

console.log('   Neighborhoods in Bogotá:');
const bogotaNeighborhoods = filterNeighborhoodsByCity(locations, 'colombia', 'bogota');
bogotaNeighborhoods.forEach(neighborhood => {
  console.log(`     ${neighborhood.locationKey}`);
});
console.log();

// Test countries extraction
console.log('6. 🌍 Countries:');
const countryList = getCountries(locations);
countryList.forEach(country => {
  console.log(`   ${country.locationKey} → ${country.country}`);
});
console.log();

// Test scope checking
console.log('7. 🎯 Scope Checking:');
const scopeTests = [
  { location: 'colombia|bogota|chapinero', parent: 'colombia' },
  { location: 'colombia|bogota|chapinero', parent: 'colombia|bogota' },
  { location: 'colombia|bogota|chapinero', parent: 'colombia|bogota|chapinero' },
  { location: 'colombia|bogota|chapinero', parent: 'peru' },
];

scopeTests.forEach(test => {
  const inScope = isLocationInScope(test.location, test.parent);
  console.log(`   "${test.location}" in scope of "${test.parent}" → ${inScope}`);
});

console.log('\n✅ All tests completed successfully!');
