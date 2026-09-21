/**
 * Midtrans Payment Gateway & Static Web Server
 * Mie Gacoan POS & Online Ordering System
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Simple .env reader if present
try {
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.trim().split('=');
      if (parts.length >= 2 && !parts[0].startsWith('#')) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
} catch (e) {}

const PORT = process.env.PORT || 3000;
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YourSandboxServerKey';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YourSandboxClientKey';
const IS_PRODUCTION = false; // false = Sandbox, true = Production

const SNAP_API_HOST = IS_PRODUCTION
  ? 'app.midtrans.com'
  : 'app.sandbox.midtrans.com';

const authHeader = 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Midtrans Server Running', env: IS_PRODUCTION ? 'production' : 'sandbox' }));
    return;
  }

  // Endpoint: Create Snap Token Transaction
  if (req.method === 'POST' && (req.url === '/api/create-midtrans-token' || req.url === '/api/create-payment')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { orderId, grossAmount, customerName, customerEmail, customerPhone, items } = payload;

        if (!orderId || !grossAmount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'orderId dan grossAmount wajib diisi' }));
          return;
        }

        // Format items for Midtrans
        const itemDetails = Array.isArray(items) && items.length > 0
          ? items.map((item, idx) => ({
              id: String(item.id || `item-${idx + 1}`).substring(0, 50),
              price: Math.round(Number(item.price) || 0),
              quantity: Math.max(1, Number(item.qty || item.quantity) || 1),
              name: String(item.title || item.name || 'Menu Gacoan').substring(0, 50)
            }))
          : undefined;

        let finalGrossAmount = Math.round(Number(grossAmount));

        const snapPayload = {
          transaction_details: {
            order_id: String(orderId),
            gross_amount: finalGrossAmount
          },
          customer_details: {
            first_name: String(customerName || 'Pelanggan').substring(0, 50),
            email: customerEmail || 'customer@gacoan.id',
            phone: customerPhone || '08123456789'
          },
          credit_card: {
            secure: true
          }
        };

        if (itemDetails) {
          const itemsSum = itemDetails.reduce((sum, it) => sum + (it.price * it.quantity), 0);
          if (itemsSum === finalGrossAmount) {
            snapPayload.item_details = itemDetails;
          }
        }

        const snapPostData = JSON.stringify(snapPayload);

        const snapReqOptions = {
          hostname: SNAP_API_HOST,
          port: 443,
          path: '/snap/v1/transactions',
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'Content-Length': Buffer.byteLength(snapPostData)
          }
        };

        const snapReq = https.request(snapReqOptions, (snapRes) => {
          let snapData = '';
          snapRes.on('data', chunk => { snapData += chunk; });
          snapRes.on('end', () => {
            console.log('Midtrans Snap Response:', snapRes.statusCode, snapData);
            res.writeHead(snapRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(snapData);
          });
        });

        snapReq.on('error', (err) => {
          console.error('Snap API Request Error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Gagal menghubungi server Midtrans', details: err.message }));
        });

        snapReq.write(snapPostData);
        snapReq.end();

      } catch (err) {
        console.error('Error processing request:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload', details: err.message }));
      }
    });
    return;
  }

  // Static File Server
  if (req.method === 'GET') {
    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';

    const safePath = path.normalize(path.join(__dirname, reqUrl));
    if (!safePath.startsWith(__dirname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Access Denied');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1><p>Halaman tidak ditemukan.</p>');
        return;
      }

      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(safePath).pipe(res);
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

function getLocalIpAddresses() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log('================================================================');
  console.log(`🍜 MIE GACOAN POS & ONLINE ORDERING SYSTEM`);
  console.log(`💻 Akses di Laptop ini : http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`📱 Akses di HP / Tablet : http://${ip}:${PORT}`);
  });
  console.log('----------------------------------------------------------------');
  console.log(`👉 Menu Pelanggan : http://localhost:${PORT}/index.html`);
  console.log(`👉 Portal Kasir   : http://localhost:${PORT}/kasir.html`);
  console.log(`👉 Portal Dapur   : http://localhost:${PORT}/dapur.html`);
  console.log(`👉 Admin Dashboard: http://localhost:${PORT}/admin.html`);
  console.log('================================================================');
});
