# Google Maps URL Generator CLI

A simple, lightweight CLI tool to generate Google Maps search URLs for locations. Supports single entry and batch processing from files.

## Features

- **Single Mode**: Enter a name and address to get a URL.
- **Batch Mode**: Process CSV or TXT files containing multiple locations.
- **Persistence**: Automatically saves all generated URLs to a local SQLite database (`locations.sqlite`) for reference.
- **JSON Output**: Exports results to JSON files.

## Installation

1. Ensure you have [Bun](https://bun.sh) installed.
2. Install dependencies:
   ```bash
   bun install
   ```

## Usage

Run the tool:
```bash
bun start
```

### Batch File Formats

**CSV (`.csv`)**:
Must have headers `name` and `address`.
```csv
name,address
Panchita,C. 2 de Mayo 298 Miraflores
```

**Text (`.txt`)**:
Each line in the format `Name | Address`.
```text
Panchita | C. 2 de Mayo 298 Miraflores
```

## Output

- Console output with JSON.
- `output.json` (Single Mode).
- `locations_urls.json` (Batch Mode, in the source folder).
- `locations.sqlite` (Internal database).
