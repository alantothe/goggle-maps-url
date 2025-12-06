import { serve } from "bun";
import { getAllLocations } from "./db";
import { open } from "open"; // We might need to add this package or just tell user to open url

export function startServer(port = 3000) {
  const server = serve({
    port,
    fetch(req) {
      const url = new URL(req.url);

      // API Endpoint
      if (url.pathname === "/api/locations") {
        const locations = getAllLocations();
        return new Response(JSON.stringify(locations), {
          headers: { "Content-Type": "application/json" },
        });
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
  console.log("Press Ctrl+C to stop the server and return to terminal.");
  
  // Try to open the browser automatically (optional, but nice)
  // Since 'open' package isn't installed, we'll just log the URL.
}

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Maps URL Manager</title>
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
                <h1 class="text-3xl font-bold text-blue-600">🌍 Location Manager</h1>
                <p class="text-gray-500">Generated Google Maps URLs</p>
            </div>
            <button onclick="fetchData()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                </svg>
                Refresh
            </button>
        </header>

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

    <script>
        async function fetchData() {
            const tbody = document.getElementById('tableBody');
            const stats = document.getElementById('stats');
            
            try {
                const res = await fetch('/api/locations');
                const data = await res.json();
                
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-400">No locations found in database.</td></tr>';
                    stats.innerText = '0 locations';
                    return;
                }

                tbody.innerHTML = data.map(loc => \`
                    <tr class="hover:bg-blue-50 transition-colors group">
                        <td class="p-4 font-medium text-gray-900">\${escapeHtml(loc.name)}</td>
                        <td class="p-4 text-gray-600">\${escapeHtml(loc.address)}</td>
                        <td class="p-4 text-right">
                            <a href="\${loc.url}" target="_blank" class="inline-flex items-center justify-center px-3 py-1.5 border border-blue-200 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition text-sm font-medium">
                                Open Maps ↗
                            </a>
                        </td>
                    </tr>
                \`).join('');
                
                stats.innerText = \`\${data.length} location\${data.length === 1 ? '' : 's'} stored\`;
            } catch (err) {
                console.error(err);
                tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-red-500">Error loading data. Make sure the server is running.</td></tr>';
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Load on start
        fetchData();
    </script>
</body>
</html>
`;

