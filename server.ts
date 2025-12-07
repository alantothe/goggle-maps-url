import { serve } from "bun";
import { getAllLocations, saveLocation } from "./db";
import { generateGoogleMapsUrl, extractInstagramData, getCoordinates } from "./utils";
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Placeholder for Google Maps API Key. Users should set this in their environment or replace here.
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export function startServer(port = 3000) {
  const server = serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // API Endpoints
      if (url.pathname === "/api/locations" && req.method === "GET") {
        try {
            const locations = getAllLocations();
            // Get current working directory
            const cwd = process.cwd();
            
            // Add absolute path to image data
            const locationsWithPaths = locations.map(loc => ({
                ...loc,
                images: loc.images ? loc.images.map(img => {
                    // Ensure img is relative path like "images/foo.jpg"
                    return img;
                }) : []
            }));

            return new Response(JSON.stringify({ locations: locationsWithPaths, cwd }), {
            headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Error fetching locations:", error);
            return new Response(JSON.stringify({ error: "Failed to fetch locations" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
      }

      if (url.pathname === "/api/add-maps" && req.method === "POST") {
        try {
            const body = await req.json();
            const { name, address } = body;

            if (!name || !address) {
                 return new Response(JSON.stringify({ error: "Name and Address required" }), { status: 400 });
            }
            
            const mapUrl = generateGoogleMapsUrl(name, address);
            let entry = { name, address, url: mapUrl, lat: null, lng: null };

            // Fetch coordinates if API key is available
            if (GOOGLE_MAPS_API_KEY) {
                const coords = await getCoordinates(address, GOOGLE_MAPS_API_KEY);
                if (coords) {
                    entry.lat = coords.lat;
                    entry.lng = coords.lng;
                }
            } else {
                console.log("Skipping Geocoding: GOOGLE_MAPS_API_KEY not set.");
            }

            saveLocation(entry);
            
            return new Response(JSON.stringify({ success: true, entry }), {
                 headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
        }
      }

      if (url.pathname === "/api/add-instagram" && req.method === "POST") {
        try {
           const body = await req.json();
           const { embedCode } = body;
           
           if (!embedCode) {
               return new Response(JSON.stringify({ error: "Embed code required" }), { status: 400 });
           }

           const { url: instaUrl, author } = extractInstagramData(embedCode);
           if (!instaUrl) {
                return new Response(JSON.stringify({ error: "Invalid embed code" }), { status: 400 });
           }

           const name = author || "Unknown_" + Date.now();
           const entry = { 
                name: name, 
                address: "Instagram Embed", 
                url: instaUrl,
                embed_code: embedCode,
                images: [],
                original_image_urls: []
           };
           
           // 1. Save initial entry
           saveLocation(entry);

           // 2. Fetch from RapidAPI
           try {
                const apiResponse = await fetch('https://instagram120.p.rapidapi.com/api/instagram/links', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': 'instagram120.p.rapidapi.com',
                    'x-rapidapi-key': '3e4f70dd00mshb714e256435f6e3p15c503jsn0c5a2df22416'
                  },
                  body: JSON.stringify({ url: instaUrl })
                });
                
                const data = await apiResponse.json();
                const imageUrls = [];

                const getBestUrl = (candidates) => {
                   if (!candidates || candidates.length === 0) return null;
                   return candidates[0].url;
                };

                if (data.media) {
                    if (data.media.carousel_media) {
                         data.media.carousel_media.forEach((item) => {
                             if (item.image_versions2 && item.image_versions2.candidates) {
                                 const url = getBestUrl(item.image_versions2.candidates);
                                 if (url) imageUrls.push(url);
                             }
                         });
                    } 
                    else if (data.media.image_versions2 && data.media.image_versions2.candidates) {
                         const url = getBestUrl(data.media.image_versions2.candidates);
                         if (url) imageUrls.push(url);
                    }
                }
                
                if (imageUrls.length === 0 && Array.isArray(data)) {
                    data.forEach((item) => {
                        if (item.pictureUrl) imageUrls.push(item.pictureUrl);
                    });
                } else if (imageUrls.length === 0 && data.pictureUrl) {
                     imageUrls.push(data.pictureUrl);
                }

                // 3. Download Images
                if (imageUrls.length > 0) {
                    const imagesDir = join(process.cwd(), 'images');
                    if (!existsSync(imagesDir)) await mkdir(imagesDir);

                    const savedPaths = [];
                    for (let i = 0; i < imageUrls.length; i++) {
                        const imgUrl = imageUrls[i];
                        try {
                            const imgRes = await fetch(imgUrl);
                            if (!imgRes.ok) continue;
                            
                            const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
                            const filename = `${cleanName}_${Date.now()}_${i}.jpg`;
                            const filePath = join(imagesDir, filename);
                            
                            await Bun.write(filePath, await imgRes.blob());
                            savedPaths.push(`images/${filename}`);
                        } catch (e) { console.error(e); }
                    }
                    
                    // Update entry with images AND original URLs
                    if (savedPaths.length > 0) {
                        entry.images = savedPaths;
                        entry.original_image_urls = imageUrls; // Save the CDN links
                        saveLocation(entry);
                    }
                }

                return new Response(JSON.stringify({ success: true, entry }), { 
                    headers: { "Content-Type": "application/json" } 
                });

           } catch (err) {
               console.error(err);
               return new Response(JSON.stringify({ error: "RapidAPI Error" }), { status: 500 });
           }

        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
        }
      }

      // Serve Images
      if (url.pathname.startsWith("/images/")) {
        const filePath = "." + url.pathname; // simple mapping
        const file = Bun.file(filePath);
        if (await file.exists()) {
           return new Response(file);
        }
        return new Response("Image Not Found", { status: 404 });
      }

      // Serve HTML
      if (url.pathname === "/") {
        return new Response(htmlTemplate, {
          headers: { "Content-Type": "text/html" },
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`\n🌐 Web Interface running at http://localhost:${server.port}`);
  if (!GOOGLE_MAPS_API_KEY) {
    console.log("⚠️  GOOGLE_MAPS_API_KEY is not set. Geocoding will be skipped.");
  }
  console.log("Press Ctrl+C to stop the server and return to terminal.");
}

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen p-8 font-sans text-gray-800">
    <div class="max-w-6xl mx-auto">
        <header class="mb-8 flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-blue-600">🌍 URL Manager</h1>
                <p class="text-gray-500">Manage Google Maps & Instagram URLs</p>
            </div>
            <div class="flex gap-3">
                <button onclick="openAddModal()" class="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    Add Instagram
                </button>
                <button onclick="openAddMapsModal()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                    Add Maps
                </button>
                <button onclick="fetchData()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                    Refresh
                </button>
            </div>
        </header>

        <div class="mb-6 flex gap-4 border-b border-gray-200">
            <button onclick="setTab('maps')" id="tab-maps" class="pb-2 px-1 border-b-2 border-blue-500 font-medium text-blue-600 transition-colors">
                Google Maps
            </button>
            <button onclick="setTab('instagram')" id="tab-instagram" class="pb-2 px-1 border-b-2 border-transparent hover:border-gray-300 font-medium text-gray-500 hover:text-gray-700 transition-colors">
                Instagram
            </button>
        </div>

        <div class="glass rounded-xl shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="p-4 font-semibold text-gray-600 w-1/4">Name</th>
                            <th class="p-4 font-semibold text-gray-600 w-2/4">Address</th>
                            <th class="p-4 font-semibold text-gray-600 w-1/4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody" class="divide-y divide-gray-100">
                        <tr>
                            <td colspan="3" class="p-8 text-center text-gray-400">Loading locations...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="stats" class="mt-4 text-right text-sm text-gray-500"></div>
    </div>

    <!-- Image Modal -->
    <div id="imageModal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                  Images
                </h3>
                <div id="modalContent" class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                  <!-- Images will be injected here -->
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" onclick="closeModal()" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add New Modal -->
    <div id="addModal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeAddModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Instagram Embed</h3>
            <div class="mb-4">
                <label for="embedCode" class="block text-sm font-medium text-gray-700 mb-2">Paste Embed Code</label>
                <textarea id="embedCode" rows="6" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="<blockquote ...>"></textarea>
            </div>
            <div id="addStatus" class="text-sm hidden"></div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" onclick="submitEmbed()" id="submitBtn" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm">
              Process & Save
            </button>
            <button type="button" onclick="closeAddModal()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Maps Modal -->
    <div id="addMapsModal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeAddMapsModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Google Maps Location</h3>
            <div class="mb-4">
                <label for="locationName" class="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                <input type="text" id="locationName" class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="e.g. Eiffel Tower">
            </div>
             <div class="mb-4">
                <label for="locationAddress" class="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <input type="text" id="locationAddress" class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="e.g. Champ de Mars, 5 Av. Anatole France, 75007 Paris, France">
            </div>
            <div id="addMapsStatus" class="text-sm hidden"></div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" onclick="submitMaps()" id="submitMapsBtn" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
              Save Location
            </button>
            <button type="button" onclick="closeAddMapsModal()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
        let allData = [];
        let serverCwd = '';
        let currentTab = 'maps';

        function openAddMapsModal() {
            document.getElementById('addMapsModal').classList.remove('hidden');
            document.getElementById('locationName').value = '';
            document.getElementById('locationAddress').value = '';
            document.getElementById('addMapsStatus').classList.add('hidden');
            document.getElementById('submitMapsBtn').disabled = false;
            document.getElementById('submitMapsBtn').innerText = 'Save Location';
        }

        function closeAddMapsModal() {
            document.getElementById('addMapsModal').classList.add('hidden');
        }

        async function submitMaps() {
            const name = document.getElementById('locationName').value;
            const address = document.getElementById('locationAddress').value;
            const status = document.getElementById('addMapsStatus');
            const btn = document.getElementById('submitMapsBtn');

            if (!name || !address) return;

            btn.disabled = true;
            btn.innerText = 'Saving...';
            status.classList.remove('hidden');
            status.innerText = 'Generating URL...';
            status.className = 'text-sm text-blue-600 mb-4';

            try {
                const res = await fetch('/api/add-maps', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ name, address })
                });

                const data = await res.json();

                if (res.ok) {
                    status.innerText = 'Success! Location saved.';
                    status.className = 'text-sm text-green-600 mb-4';
                    setTimeout(() => {
                        closeAddMapsModal();
                        fetchData();
                    }, 1000);
                } else {
                     status.innerText = 'Error: ' + (data.error || 'Unknown error');
                     status.className = 'text-sm text-red-600 mb-4';
                     btn.disabled = false;
                     btn.innerText = 'Save Location';
                }
            } catch (e) {
                 status.innerText = 'Network Error';
                 status.className = 'text-sm text-red-600 mb-4';
                 btn.disabled = false;
                 btn.innerText = 'Save Location';
            }
        }

        function openAddModal() {
            document.getElementById('addModal').classList.remove('hidden');
            document.getElementById('embedCode').value = '';
            document.getElementById('addStatus').classList.add('hidden');
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('submitBtn').innerText = 'Process & Save';
        }

        function closeAddModal() {
            document.getElementById('addModal').classList.add('hidden');
        }

        async function submitEmbed() {
            const code = document.getElementById('embedCode').value;
            const status = document.getElementById('addStatus');
            const btn = document.getElementById('submitBtn');
            
            if (!code) return;

            btn.disabled = true;
            btn.innerText = 'Processing...';
            status.classList.remove('hidden');
            status.innerText = 'Extracting data and downloading images...';
            status.className = 'text-sm text-blue-600 mb-4';

            try {
                const res = await fetch('/api/add-instagram', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ embedCode: code })
                });

                const data = await res.json();

                if (res.ok) {
                    status.innerText = 'Success! Refreshing...';
                    status.className = 'text-sm text-green-600 mb-4';
                    setTimeout(() => {
                        closeAddModal();
                        fetchData();
                    }, 1000);
                } else {
                    status.innerText = 'Error: ' + (data.error || 'Unknown error');
                    status.className = 'text-sm text-red-600 mb-4';
                    btn.disabled = false;
                    btn.innerText = 'Process & Save';
                }
            } catch (e) {
                status.innerText = 'Network Error';
                status.className = 'text-sm text-red-600 mb-4';
                btn.disabled = false;
                btn.innerText = 'Process & Save';
            }
        }

        function openModal(images, originalUrls) {
            const modal = document.getElementById('imageModal');
            const content = document.getElementById('modalContent');
            
            if (!images || images.length === 0) {
                content.innerHTML = '<p class="text-gray-500 italic">No images downloaded.</p>';
            } else {
                // Get current origin (e.g. http://localhost:3000)
                const origin = window.location.origin;
                
                content.innerHTML = images.map((img, index) => {
                    // Full URL for display and dragging
                    const imgPath = img.startsWith('/') ? img.substring(1) : img;
                    const fullUrl = origin + '/' + imgPath;
                    
                    // Original CDN URL
                    const originalCdnUrl = (originalUrls && originalUrls[index]) ? originalUrls[index] : '';

                    return \`
                    <div class="relative group">
                        <img src="\${fullUrl}" 
                             class="w-full h-48 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                             onclick="window.open(this.src, '_blank')"
                             draggable="true"
                             ondragstart="handleDragStart(event, '\${fullUrl}')">
                        
                        <!-- Copy CDN URL Button -->
                         <button onclick="handleCopy('\${escapeHtml(originalCdnUrl)}', this, 'bg-indigo-600', 'border-indigo-600')" 
                            class="\${originalCdnUrl ? '' : 'hidden'} absolute top-2 right-2 bg-white hover:bg-gray-100 text-indigo-600 p-1.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-all border border-gray-200"
                            title="Copy Original CDN Link">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                             </svg>
                        </button>

                        <div class="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Click to expand
                        </div>
                    </div>
                \`}).join('');
            }
            
            modal.classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('imageModal').classList.add('hidden');
        }

        function setTab(tab) {
            currentTab = tab;
            
            // Update Tab UI
            ['maps', 'instagram'].forEach(t => {
                const el = document.getElementById('tab-' + t);
                if (t === tab) {
                    el.className = 'pb-2 px-1 border-b-2 border-blue-500 font-medium text-blue-600 transition-colors';
                } else {
                    el.className = 'pb-2 px-1 border-b-2 border-transparent hover:border-gray-300 font-medium text-gray-500 hover:text-gray-700 transition-colors';
                }
            });

            renderTable();
        }

        async function fetchData() {
            const tbody = document.getElementById('tableBody');
            const stats = document.getElementById('stats');
            
            try {
                const res = await fetch('/api/locations');
                if (!res.ok) {
                    throw new Error(\`Server returned \${res.status} \${res.statusText}\`);
                }

                const responseData = await res.json();
                
                // Handle new response structure { locations: [], cwd: "..." }
                if (responseData && responseData.locations && Array.isArray(responseData.locations)) {
                    allData = responseData.locations;
                    serverCwd = responseData.cwd;
                } else if (Array.isArray(responseData)) {
                    // Fallback for old structure (array)
                    allData = responseData;
                    serverCwd = '';
                } else {
                    throw new Error('Invalid data format received from server');
                }
                
                renderTable();
            } catch (err) {
                console.error(err);
                tbody.innerHTML = \`<tr><td colspan="3" class="p-8 text-center text-red-500">Error loading data: \${err.message}.<br>Make sure the server is running.</td></tr>\`;
            }
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            const thead = document.querySelector('thead');
            const stats = document.getElementById('stats');

            let filteredData = [];
            if (currentTab === 'maps') {
                filteredData = allData.filter(d => d.address !== 'Instagram Embed');
            } else if (currentTab === 'instagram') {
                filteredData = allData.filter(d => d.address === 'Instagram Embed');
            }

            // Update Header
            if (currentTab === 'instagram') {
                thead.innerHTML = \`
                    <tr>
                        <th class="p-4 font-semibold text-gray-600 w-24">Preview</th>
                        <th class="p-4 font-semibold text-gray-600">Name</th>
                        <th class="p-4 font-semibold text-gray-600 w-1/4 text-right">Action</th>
                    </tr>
                \`;
            } else {
                 thead.innerHTML = \`
                    <tr>
                        <th class="p-4 font-semibold text-gray-600 w-24">Preview</th>
                        <th class="p-4 font-semibold text-gray-600 w-1/5">Name</th>
                        <th class="p-4 font-semibold text-gray-600 w-2/5">Address</th>
                        <th class="p-4 font-semibold text-gray-600 w-1/5">Coordinates</th>
                        <th class="p-4 font-semibold text-gray-600 w-auto text-right">Action</th>
                    </tr>
                \`;
            }

            if (filteredData.length === 0) {
                const colSpan = currentTab === 'instagram' ? 3 : 5;
                tbody.innerHTML = \`<tr><td colspan="\${colSpan}" class="p-8 text-center text-gray-400">No locations found.</td></tr>\`;
                stats.innerText = '0 locations';
                return;
            }

            tbody.innerHTML = filteredData.map(loc => {
                const isInstagram = loc.address === 'Instagram Embed';
                
                // Image Preview Logic
                let previewHtml = '';
                if (loc.images && loc.images.length > 0) {
                     previewHtml = \`<img src="/\${loc.images[0]}" class="h-12 w-12 object-cover rounded-md shadow-sm border border-gray-200">\`;
                } else {
                     // Fallback icon
                     previewHtml = isInstagram 
                        ? '<div class="h-12 w-12 bg-pink-50 rounded-md flex items-center justify-center text-pink-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div>'
                        : '<div class="h-12 w-12 bg-blue-50 rounded-md flex items-center justify-center text-blue-300">📍</div>';
                }

                // Base classes for all action buttons
                const btnBase = "inline-flex items-center justify-center px-3 py-1.5 border rounded-md transition-all text-sm font-medium w-24 text-center";

                // Specific styles
                const mapBtnClass = "border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300";
                const instaBtnClass = "border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300";
                const embedBtnClass = "border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300";
                
                let actionBtn;
                if (isInstagram) {
                    // Prepare images array safely
                    const imagesJson = JSON.stringify(loc.images || []).replace(/"/g, '&quot;');
                    const originalUrlsJson = JSON.stringify(loc.original_image_urls || []).replace(/"/g, '&quot;');
                    
                    actionBtn = \`
                        <div class="flex gap-2 justify-end">
                            <button onclick="handleCopy('\${loc.url}', this, 'bg-pink-600', 'border-pink-600')" class="\${btnBase} \${instaBtnClass}">
                            Link
                            </button>
                            \${loc.embed_code ? \`
                            <button onclick="handleCopy(this.getAttribute('data-embed'), this, 'bg-purple-600', 'border-purple-600')" class="\${btnBase} \${embedBtnClass}" data-embed="\${escapeHtml(loc.embed_code)}">
                            Embed
                            </button>
                            \` : ''}
                            \${(loc.images && loc.images.length > 0) ? \`
                            <button onclick="openModal(\${imagesJson}, \${originalUrlsJson})" class="\${btnBase} border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300">
                                \${loc.images.length} Img
                            </button>
                            \` : ''}
                        </div>
                    \`;
                } else {
                    const hasCoords = loc.lat && loc.lng;
                    actionBtn = \`
                        <div class="flex gap-2 justify-end">
                            \${hasCoords ? \`
                                <button onclick="handleCopy('\${loc.lat}', this, 'bg-gray-600', 'border-gray-600')" class="\${btnBase} border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300" title="Copy Latitude">
                                    Lat
                                </button>
                                <button onclick="handleCopy('\${loc.lng}', this, 'bg-gray-600', 'border-gray-600')" class="\${btnBase} border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300" title="Copy Longitude">
                                    Lng
                                </button>
                            \` : ''}
                            <a href="\${loc.url}" target="_blank" class="\${btnBase} \${mapBtnClass}">
                                Maps
                            </a>
                        </div>
                    \`;
                }

                if (isInstagram) {
                     return \`
                        <tr class="hover:bg-gray-50 transition-colors group">
                            <td class="p-4">
                                \${previewHtml}
                            </td>
                            <td class="p-4 font-medium text-gray-900">
                                \${escapeHtml(loc.name)}
                            </td>
                            <td class="p-4 text-right">
                                \${actionBtn}
                            </td>
                        </tr>
                    \`;
                } else {
                    return \`
                        <tr class="hover:bg-gray-50 transition-colors group">
                            <td class="p-4">
                                \${previewHtml}
                            </td>
                            <td class="p-4 font-medium text-gray-900">
                                \${escapeHtml(loc.name)}
                            </td>
                            <td class="p-4 text-gray-600">\${escapeHtml(loc.address)}</td>
                            <td class="p-4 text-gray-500 text-sm">
                                \${loc.lat && loc.lng ? \`\${loc.lat.toFixed(5)}, \${loc.lng.toFixed(5)}\` : '<span class="italic text-gray-400">N/A</span>'}
                            </td>
                            <td class="p-4 text-right">
                                \${actionBtn}
                            </td>
                        </tr>
                    \`;
                }
            }).join('');
            
            stats.innerText = \`\${filteredData.length} location\${filteredData.length === 1 ? '' : 's'} displayed\`;
        }
        
        async function handleCopy(text, btn, activeBgClass, activeBorderClass) {
            // Helper to decode if it's from data attribute
            let contentToCopy = text;
            if (text.includes('&lt;') || text.includes('&amp;')) {
                 const textarea = document.createElement('textarea');
                 textarea.innerHTML = text;
                 contentToCopy = textarea.value;
            }

            try {
                await navigator.clipboard.writeText(contentToCopy);
                
                // Save original text and classes on the element itself if not already saved
                if (!btn.hasAttribute('data-original-text')) {
                    btn.setAttribute('data-original-text', btn.innerText);
                }
                
                // We use dataset to check if we're already in 'copied' state to avoid overwriting original classes with active ones
                if (!btn.dataset.isCopied) {
                     btn.setAttribute('data-original-classes', btn.className);
                }

                const originalText = btn.getAttribute('data-original-text');
                const savedClasses = btn.getAttribute('data-original-classes');
                
                // Mark as copied state
                btn.dataset.isCopied = "true";

                // Change state
                btn.innerText = 'Copied!';
                btn.className = \`inline-flex items-center justify-center px-3 py-1.5 border rounded-md transition-all text-sm font-medium w-24 text-center text-white \${activeBgClass} \${activeBorderClass}\`;

                // Clear any existing timeout to restart the timer if clicked again
                if (btn.dataset.timeoutId) {
                    clearTimeout(parseInt(btn.dataset.timeoutId));
                }

                const timeoutId = setTimeout(() => {
                    btn.innerText = originalText;
                    btn.className = savedClasses;
                    btn.dataset.isCopied = ""; // Reset state
                    btn.dataset.timeoutId = "";
                }, 1500);
                
                btn.dataset.timeoutId = timeoutId.toString();

            } catch (err) {
                 console.error('Failed to copy!', err);
            }
        }

        function handleDragStart(e, url) {
            // Set data for drag event - this helps browser understand we're dragging a URL/File
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', url);
            e.dataTransfer.setData('text/uri-list', url);
            
            // Try to download the image on drop if supported (Chrome/Edge)
            const fileName = url.split('/').pop();
            e.dataTransfer.setData('DownloadURL', \`image/jpeg:\${fileName}:\${url}\`);
        }

        function escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Load on start
        fetchData();
    </script>
</body>
</html>
`;
