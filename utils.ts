import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function generateGoogleMapsUrl(name: string, address: string): string {
  const query = `${name} ${address}`;
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
}

export interface RawLocation {
  name: string;
  address: string;
}

export async function parseCsv(filePath: string): Promise<RawLocation[]> {
  const content = await readFile(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  return records.map((record: any) => ({
    name: record.name,
    address: record.address
  }));
}

export async function parseTxt(filePath: string): Promise<RawLocation[]> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const locations: RawLocation[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Skip header if it looks like the example "Location Name | Full Address"
    // Although the user example implies the file content starts with data or maybe header. 
    // The example shows:
    // Location Name | Full Address
    // Panchita...
    // But in the prompt description for TXT it says:
    // "TXT with each line: Location Name | Full Address"
    // The example provided:
    // Panchita - Miraflores | C. 2 de Mayo 298, Miraflores 15074, Peru
    // Eiffel Tower | Eiffel Tower Paris
    // It doesn't explicitly say there is a header row in TXT like it does for CSV.
    // I will check if the line contains the delimiter '|'.
    
    if (line.includes('|')) {
      const [name, address] = line.split('|').map(s => s.trim());
      if (name && address) {
        locations.push({ name, address });
      }
    }
  }
  
  return locations;
}

export async function processLocationsFile(filePath: string): Promise<RawLocation[]> {
  if (filePath.endsWith('.csv')) {
    return parseCsv(filePath);
  } else if (filePath.endsWith('.txt')) {
    return parseTxt(filePath);
  } else {
    throw new Error('Unsupported file format. Please use .csv or .txt');
  }
}

