import prompts from 'prompts';
import { join } from 'node:path';
import { readdir, writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { saveLocation, getAllLocations, clearDatabase, type LocationEntry } from './db';
import { generateGoogleMapsUrl, processLocationsFile, extractInstagramData, type RawLocation } from './utils';
import { startServer } from './server';

async function main() {
  console.log("🌍 URL Manager CLI");
  console.log("--------------------------------");

  const response = await prompts({
    type: 'select',
    name: 'mode',
    message: 'Select Mode:',
    choices: [
      { title: 'Single Location', value: 'single' },
      { title: 'Batch Mode (from file)', value: 'batch' },
      { title: 'Extract from Instagram Embed', value: 'instagram' },
      { title: 'View Database History', value: 'history' },
      { title: 'Start Web Interface', value: 'web' },
      { title: 'Kill / Clear All Data', value: 'kill' },
      { title: 'Exit', value: 'exit' }
    ]
  });

  if (response.mode === 'single') {
    await handleSingleMode();
  } else if (response.mode === 'batch') {
    await handleBatchMode();
  } else if (response.mode === 'instagram') {
    await handleInstagramMode();
  } else if (response.mode === 'history') {
    await handleViewHistory();
  } else if (response.mode === 'web') {
    startServer();
    // Keep process alive for server
  } else if (response.mode === 'kill') {
    await handleKillMode();
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
    URL: l.url,
    Images: l.images ? l.images.length : 0
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

async function handleInstagramMode() {
  const methodResponse = await prompts({
    type: 'select',
    name: 'method',
    message: 'Select Input Method:',
    choices: [
      { title: 'Paste Code', value: 'paste' },
      { title: 'Read from File', value: 'file' }
    ]
  });

  let htmlContent = '';

  if (methodResponse.method === 'paste') {
    const pasteResponse = await prompts({
      type: 'text',
      name: 'html',
      message: 'Paste Instagram Embed Code:',
    });
    htmlContent = pasteResponse.html;
  } else if (methodResponse.method === 'file') {
     const fileResponse = await prompts({
      type: 'text',
      name: 'path',
      message: 'Enter file path containing embed code:',
      initial: process.cwd()
    });
    if (existsSync(fileResponse.path)) {
      htmlContent = await readFile(fileResponse.path, 'utf-8');
    } else {
      console.error("❌ File does not exist.");
      return;
    }
  } else {
    return;
  }

  if (!htmlContent) {
    console.error("❌ No content provided.");
    return;
  }

  const { url, author } = extractInstagramData(htmlContent);

  if (!url) {
    console.error("❌ Could not extract Instagram URL from the provided code.");
    return;
  }

  const name = author || (await prompts({
      type: 'text',
      name: 'name',
      message: 'Could not extract author name. Please enter a name for this location:',
      validate: value => value.length > 0 ? true : 'Name is required'
    })).name;
    
  if (!name) return;

  const entry: LocationEntry = { 
    name: name, 
    address: "Instagram Embed", 
    url: url,
    embed_code: htmlContent
  };

  saveLocation(entry);
  console.log(`\n✅ Saved Instagram Location: ${name}`);
  console.log(`🔗 URL: ${url}`);

  try {
    console.log('\n🔄 Fetching data from RapidAPI...');
    const apiResponse = await fetch('https://instagram120.p.rapidapi.com/api/instagram/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'instagram120.p.rapidapi.com',
        'x-rapidapi-key': '3e4f70dd00mshb714e256435f6e3p15c503jsn0c5a2df22416'
      },
      body: JSON.stringify({ url: url })
    });
    
    const data = await apiResponse.json();
    // console.log('✅ RapidAPI Response:', data);

    const imageUrls: string[] = [];

    // Helper to find URL in candidates
    const getBestUrl = (candidates: any[]) => {
       if (!candidates || candidates.length === 0) return null;
       // Usually the first one is the best quality, or we can look for specific dimensions
       return candidates[0].url;
    };

    if (data.media) {
        // Case 1: Carousel (multiple images)
        if (data.media.carousel_media) {
             data.media.carousel_media.forEach((item: any) => {
                 if (item.image_versions2 && item.image_versions2.candidates) {
                     const url = getBestUrl(item.image_versions2.candidates);
                     if (url) imageUrls.push(url);
                 }
             });
        } 
        // Case 2: Single Image
        else if (data.media.image_versions2 && data.media.image_versions2.candidates) {
             const url = getBestUrl(data.media.image_versions2.candidates);
             if (url) imageUrls.push(url);
        }
    }

    // Fallback: Check if there is a flat list of objects with pictureUrl (based on user prompt hint)
    // or if the response structure is different than expected standard Instagram API.
    // Some RapidAPI endpoints return a simplified array.
    if (imageUrls.length === 0 && Array.isArray(data)) {
        data.forEach((item: any) => {
            if (item.pictureUrl) imageUrls.push(item.pictureUrl);
        });
    } else if (imageUrls.length === 0 && data.pictureUrl) {
         imageUrls.push(data.pictureUrl);
    }

    if (imageUrls.length > 0) {
        console.log('\n📸 Extracted Image URLs:');
        console.log(imageUrls);

        console.log('\n⬇️ Downloading images...');
        const imagesDir = join(process.cwd(), 'images');
        
        // Ensure directory exists
        if (!existsSync(imagesDir)) {
            await mkdir(imagesDir);
        }

        const savedPaths: string[] = [];

        for (let i = 0; i < imageUrls.length; i++) {
            const imgUrl = imageUrls[i];
            try {
                const imgRes = await fetch(imgUrl);
                if (!imgRes.ok) throw new Error(`Failed to fetch ${imgUrl}`);
                
                // Create a filename: cleaned_name_timestamp_index.jpg
                const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
                const filename = `${cleanName}_${Date.now()}_${i}.jpg`;
                const filePath = join(imagesDir, filename);
                
                // Write file using Bun
                await Bun.write(filePath, await imgRes.blob());
                
                savedPaths.push(`images/${filename}`); // Store relative path
                console.log(`Saved: images/${filename}`);
            } catch (err) {
                console.error(`Error downloading image ${i + 1}:`, err);
            }
        }

        if (savedPaths.length > 0) {
            // Update the entry with image paths and save again
            entry.images = savedPaths;
            saveLocation(entry);
            console.log('✅ Database updated with local image paths.');
        }

    } else {
        console.log('⚠️ No image URLs found in the response.');
        console.log('Full Response for debugging:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error fetching from RapidAPI:', error);
  }
}

async function handleKillMode() {
  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: '⚠️  Are you sure you want to DELETE ALL locations from the database? This cannot be undone.',
    initial: false
  });

  if (confirm.value) {
    const success = clearDatabase();
    if (success) {
      console.log("\n💥 Database cleared successfully. All records have been deleted.");
    } else {
      console.error("\n❌ Failed to clear database.");
    }
  } else {
    console.log("\nOperation cancelled.");
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
