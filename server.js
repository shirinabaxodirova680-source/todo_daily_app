// ═══════════════════════════════════════════════
//  SMART DAILY PLANNER — Real-Time Dev Server
//  Zero dependencies (Built-in Node.js HTTP & SSE)
// ═══════════════════════════════════════════════

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

// Load local secrets for development; production should provide environment variables.
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css':  'text/css; charset=UTF-8',
  '.js':   'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// Connected SSE clients for live reload
const sseClients = new Set();

// Live reload client snippet injected into HTML
const LIVE_RELOAD_SCRIPT = `
<!-- Real-Time Live Reload -->
<script>
  (function() {
    var es = new EventSource('/live-reload');
    es.onmessage = function(e) {
      if (e.data === 'reload') {
        console.log('[LiveReload] Fayl yangilandi, sahifa qayta yuklanmoqda...');
        location.reload();
      }
    };
    es.onerror = function() {
      setTimeout(function() {
        try { es.close(); } catch(_) {}
        location.reload();
      }, 2500);
    };
  })();
</script>
</body>`;

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.setEncoding('utf8');
    req.on('data', chunk => {
      size += Buffer.byteLength(chunk);
      if (size > maxBytes) {
        reject(new Error('Request body is too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if (urlPath === '/api/ai') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ error: 'AI service is not configured on the server' }));
      return;
    }

    try {
      const request = JSON.parse(await readRequestBody(req, 64 * 1024));
      if (!Array.isArray(request.messages) || request.messages.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ error: 'messages must be a non-empty array' }));
        return;
      }

      const groqResponse = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: request.messages,
          temperature: 0.7,
          max_tokens: 512,
        }),
      });
      const responseText = await groqResponse.text();
      res.writeHead(groqResponse.status, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Cache-Control': 'no-store',
      });
      res.end(responseText);
    } catch (error) {
      console.error('[AI] Request failed:', error.message);
      res.writeHead(502, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ error: 'AI service request failed' }));
    }
    return;
  }

  // SSE endpoint for real-time live reload
  if (urlPath === '/live-reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write("data: connected\n\n");
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // File resolution
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Security: prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  // If path is directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404: Fayl topilmadi');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('500: Server xatosi');
      }
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    // Inject live-reload script into HTML
    if (ext === '.html') {
      let html = content.toString('utf-8');
      if (html.includes('</body>')) {
        html = html.replace('</body>', LIVE_RELOAD_SCRIPT);
      } else {
        html += LIVE_RELOAD_SCRIPT;
      }
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      res.end(html);
      return;
    }

    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  });
});

// Watch directory for changes (Real-Time Live Reload)
let debounceTimer = null;
try {
  fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (filename.includes('.git') || filename.includes('node_modules')) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log("[LiveReload] " + filename + " o'zgardi -> brauzer yangilanmoqda...");
      for (const client of sseClients) {
        try {
          client.write("data: reload\n\n");
        } catch (_) {}
      }
    }, 120);
  });
} catch (e) {
  console.warn("fs.watch recursive warning:", e.message);
}

// Start listening
server.listen(PORT, () => {
  const localUrl = "http://localhost:" + PORT;
  console.log("════════════════════════════════════════════════════════");
  console.log(" 🚀 Smart Daily Planner Localhost da ishga tushdi!");
  console.log(" 🌐 URL: " + localUrl);
  console.log(" ⚡ Real-Time Live Reload: FAOL (fayllar real vaqtda yangilanadi)");
  console.log("════════════════════════════════════════════════════════");

  // Open browser automatically
  const startCmd = process.platform === 'win32' ? 'start "" "' + localUrl + '"' :
                   process.platform === 'darwin' ? 'open "' + localUrl + '"' : 'xdg-open "' + localUrl + '"';
  exec(startCmd, () => {});
});

// Graceful exit
process.on('SIGINT', () => {
  console.log("\nServer to'xtatildi.");
  process.exit(0);
});
