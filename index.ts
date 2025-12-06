import prompts from 'prompts';
import { join } from 'node:path';
import { readdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { saveLocation, getAllLocations, type LocationEntry } from './db';
import { generateGoogleMapsUrl, processLocationsFile, type RawLocation } from './utils';
import { startServer } from './server';

async function main() {
  console.log("🌍 Google Maps URL Generator CLI");
  console.log("--------------------------------");

  const response = await prompts({
    type: 'select',
    name: 'mode',
    message: 'Select Mode:',
    choices: [
      { title: 'Single Location', value: 'single' },
      { title: 'Batch Mode (from file)', value: 'batch' },
      { title: 'View Database History', value: 'history' },
      { title: 'Start Web Interface', value: 'web' },
      { title: 'Exit', value: 'exit' }
    ]
  });

  if (response.mode === 'single') {
    await handleSingleMode();
  } else if (response.mode === 'batch') {
    await handleBatchMode();
  } else if (response.mode === 'history') {
    await handleViewHistory();
  } else if (response.mode === 'web') {
    startServer();
    // Keep process alive for server
  } else {
    console.log("Goodbye!");
    process.exit(0);
  }
}

async function handleViewHistory() {
  const locations = getAllLocations();
  
  if (locations.length === 0) {
    console.log("\n📭 Database is empty.");
    return;
  }

  console.log(`\n📜 Found ${locations.length} locations in history:\n`);
  // console.table is nice, but let's make sure we display relevant info clearly
  // Limiting URL length for display might be good if it's too long, but usually console.table handles it.
  console.table(locations.map(l => ({
    Name: l.name,
    Address: l.address.length > 50 ? l.address.substring(0, 47) + '...' : l.address,
    URL: l.url
  })));
}

async function handleSingleMode() {
  const input = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Enter Location Name:',
      validate: value => value.length > 0 ? true : 'Name is required'
    },
    {
      type: 'text',
      name: 'address',
      message: 'Enter Full Address:',
      validate: value => value.length > 0 ? true : 'Address is required'
    }
  ]);

  if (!input.name || !input.address) return;

  const url = generateGoogleMapsUrl(input.name, input.address);
  const entry: LocationEntry = { name: input.name, address: input.address, url };

  // Save to DB
  saveLocation(entry);

  // Output JSON
  const output = { [input.name]: url };
  console.log("\n✅ Generated URL:");
  console.log(JSON.stringify(output, null, 2));

  // Optional Save
  const save = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Save to output.json?',
    initial: true
  });

  if (save.value) {
    await updateJsonFile('output.json', output);
    console.log(`Saved to ${process.cwd()}/output.json`);
  }
}

async function handleBatchMode() {
  const folderInput = await prompts({
    type: 'text',
    name: 'path',
    message: 'Enter folder path containing locations file:',
    initial: process.cwd()
  });

  const folderPath = folderInput.path;

  try {
    if (!existsSync(folderPath)) {
      console.error("❌ Folder does not exist.");
      return;
    }

    const files = await readdir(folderPath);
    const locationFiles = files.filter(f => f.endsWith('.csv') || f.endsWith('.txt'));

    if (locationFiles.length === 0) {
      console.error("❌ No .csv or .txt files found in the folder.");
      return;
    }

    const fileSelection = await prompts({
      type: 'select',
      name: 'filename',
      message: 'Select a file to process:',
      choices: locationFiles.map(f => ({ title: f, value: f }))
    });

    if (!fileSelection.filename) return;

    const fullPath = join(folderPath, fileSelection.filename);
    console.log(`Processing ${fullPath}...`);

    const rawLocations = await processLocationsFile(fullPath);
    const newEntries: Record<string, string> = {};
    let processedCount = 0;

    for (const loc of rawLocations) {
      const url = generateGoogleMapsUrl(loc.name, loc.address);
      const entry: LocationEntry = { name: loc.name, address: loc.address, url };
      
      saveLocation(entry);
      newEntries[loc.name] = url;
      processedCount++;
    }

    console.log(`\n✅ Processed ${processedCount} locations.`);
    console.log(JSON.stringify(newEntries, null, 2));

    // Save to JSON in the same folder
    const outputFileName = 'locations_urls.json';
    const outputPath = join(folderPath, outputFileName);
    
    await updateJsonFile(outputPath, newEntries);
    console.log(`Saved/Updated: ${outputPath}`);

  } catch (error) {
    console.error("Error processing batch:", error);
  }
}

async function updateJsonFile(filePath: string, newData: Record<string, string>) {
  let existingData: Record<string, string> = {};
  
  if (existsSync(filePath)) {
    try {
      const content = await readFile(filePath, 'utf-8');
      existingData = JSON.parse(content);
    } catch (e) {
      console.warn("Could not parse existing JSON file, starting fresh.");
    }
  }

  const mergedData = { ...existingData, ...newData };
  await writeFile(filePath, JSON.stringify(mergedData, null, 2));
}

// Run
main().catch(console.error);
