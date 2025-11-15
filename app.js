const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const pool = require('./database');

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


// the login using mysql
function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => (body += chunk));

  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');

      let role = (data.role || '').toLowerCase();
      if (role === 'client' || role === 'home') role = 'homeowner';
      if (role === 'con') role = 'contractor';

      const emailOrUsername =
        (data.email || data.username || '').toLowerCase();
      const password = data.password || '';

      if (!role || !emailOrUsername || !password) {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(
          JSON.stringify({
            ok: false,
            error: 'Missing role/email/username/password',
          })
        );
      }

      // this is where it chrcks the users table for a matching user
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE role = ? AND email = ? AND password_hash = ? LIMIT 1',
        [role, emailOrUsername, password]
      );

      if (rows.length === 0) {
        // if no matches found then it will prompt invalid
        res.writeHead(401, { 'content-type': 'application/json' });
        return res.end(
          JSON.stringify({ ok: false, error: 'Invalid credentials' })
        );
      }

      // ✔️ if their is a match found it will redirect based on role
      let redirect = '/homeDashboard.html';
      if (role === 'contractor') redirect = '/conDashboard.html';
      if (role === 'admin') redirect = '/adminDashboard.html';

      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, redirect }));
    } catch (error) {
      console.error(error);
      res.writeHead(500, { 'content-type': 'application/json' });
      return res.end(
        JSON.stringify({ ok: false, error: 'Server error / bad JSON' })
      );
    }
  });
}

const serverObj = http.createServer(async function (req, res) {
    console.log("Request URL:", req.url);
    const urlObj = url.parse(req.url, true);
// this is a test 
if (urlObj.pathname === '/test-db') {
    try {
      const [rows] = await pool.query('SELECT 1 + 1 AS result');
      res.writeHead(200, { 'content-type': 'text/plain' });
      return res.end('Database connection works! Result: ' + rows[0].result);
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'content-type': 'text/plain' });
      return res.end('Database error: ' + err.message);
    }
  }
	// this is the login handleer 
if (urlObj.pathname === '/login') {
  // helper for quick JSON responses used by post  
  function sendJSON(status, obj) {
    res.writeHead(status, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(obj));
  }

  if (req.method === 'GET') {
    const { role, username, password } = urlObj.query || {};
    if (!role || !username || !password) {
      res.writeHead(400, { 'content-type': 'text/plain' });
      return res.end('Missing role/username/password');
    }

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
    return handleLogin(req, res);
  }

  res.writeHead(405, { 'content-type': 'text/plain' });
  return res.end('Method Not Allowed');
}
// end of login handler

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

            // Default to index.html
            if (urlObj.pathname === "/") {
                filePath = path.join(__dirname, "public", "index.html");
            }

            sendFile(filePath, res);
    }
});

serverObj.listen(80, function () {
    console.log("Server is listening on port 80");
});
