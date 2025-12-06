# Google Maps URL Generator CLI

A simple, lightweight CLI tool to generate Google Maps search URLs for locations. Supports single entry and batch processing from files, and includes a web interface for viewing history.

## Features

- **Single Mode**: Enter a name and address to get a URL.
- **Batch Mode**: Process CSV or TXT files containing multiple locations.
- **View History**: View all previously generated URLs stored in the local database.
- **Web Interface**: Launch a local web server to browse your location history in a beautiful UI.
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

## Web Interface

Select **Start Web Interface** from the main menu to launch the dashboard at `http://localhost:3000`.
It allows you to:
- View all stored locations.
- Quickly open Google Maps links.
- Refresh data in real-time.

## Output

- Console output with JSON.
- `output.json` (Single Mode).
- `locations_urls.json` (Batch Mode, in the source folder).
- `locations.sqlite` (Internal database).
