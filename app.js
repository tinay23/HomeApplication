const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

function sendFile(filePath, res) {
    fs.readFile(filePath, function (err, data) {
        if (err) {
            error(res, 404, "File not found");
            return;
        }

        const ext = path.extname(filePath);
        const contentType = getContentType(ext);

        res.writeHead(200, { 'content-type': contentType });
        res.write(data);
        res.end();
    });
}

function getContentType(ext) {
    const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
}

function error(res, status, message) {
    res.writeHead(status, { 'content-type': 'text/plain' });
    res.write(message);
    res.end();
}


// --- handles /login POST (expects JSON: { role, email, password }) ---
function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}');
      const role = (data.role || '').toLowerCase();

      // TODO: add real auth here; for now we just route by role
      let redirect = null;
      if (role === 'homeowner' || role === 'client' || role === 'home') {
        redirect = '/homeDashboard.html';
      } else if (role === 'contractor' || role === 'con') {
        redirect = '/conDashboard.html';
      } else if (role === 'admin') {
        redirect = '/adminDashboard.html';
      }

      if (!redirect) {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid role' }));
      }

      // respond in a fetch-friendly way
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, redirect }));
    } catch (e) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Bad JSON' }));
    }
  });
}

const serverObj = http.createServer(function (req, res) {
    console.log("Request URL:", req.url);
    const urlObj = url.parse(req.url, true);
	// ---- LOGIN HANDLER (supports GET and POST) ----
if (urlObj.pathname === '/login') {
  // helper for quick JSON responses (used by POST path)
  function sendJSON(status, obj) {
    res.writeHead(status, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(obj));
  }

  if (req.method === 'GET') {
    // GET /login?role=...&username=...&password=...
    const { role, username, password } = urlObj.query || {};
    if (!role || !username || !password) {
      res.writeHead(400, { 'content-type': 'text/plain' });
      return res.end('Missing role/username/password');
    }

    // demo redirect by role (dashboards are already in public/)
    const redirectMap = {
      contractor: '/conDashboard.html',
      homeowner:  '/homeDashboard.html',
      admin:      '/adminDashboard.html',
    };
    const dest = redirectMap[role] || '/login.html';
    res.writeHead(302, { Location: dest });
    return res.end();
  }

  if (req.method === 'POST') {
    // You already have handleLogin(req,res) defined above.
    // It should read JSON body and respond with JSON.
    return handleLogin(req, res);
  }

  res.writeHead(405, { 'content-type': 'text/plain' });
  return res.end('Method Not Allowed');
}
// ---- END LOGIN HANDLER ----

    switch (urlObj.pathname) {
        case "/schedule":
            schedule(urlObj.query, res);
            break;
        case "/cancel":
            cancel(urlObj.query, res);
            break;
        case "/check":
            check(urlObj.query, res);
            break;
        default:
            // Build file path for static files
            let filePath = path.join(__dirname, "public", urlObj.pathname);

            // Default to index.html if just "/"
            if (urlObj.pathname === "/") {
                filePath = path.join(__dirname, "public", "index.html");
            }

            sendFile(filePath, res);
    }
});

serverObj.listen(80, function () {
    console.log("Server is listening on port 80");
});
