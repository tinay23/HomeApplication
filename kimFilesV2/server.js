const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

function sendFile(filePath, res) {
  fs.readFile(filePath, function (err, data) {
    if (err) {
      return error(res, 404, "File not found");
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
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

//using json to communicate with login files
function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}

//error messages
function error(res, status, message) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.write(message);
  res.end();
}

//test array test users
const USERS = {
  contractor: { user: "contractor1", pass: "password123", redirect: "/conDashboard.html" },
  homeowner:  { user: "homeowner1",  pass: "password123", redirect: "/homeDashboard.html" },
  admin:      { user: "admin1",      pass: "password123", redirect: "/adminDashboard.html" },
};

//handle which page to login to
function handleLogin(urlObj, res) {
  let role = (urlObj.query.role || "").toString().toLowerCase();

  //trying to get role using url
  if (!role) {
    const parts = urlObj.pathname.split("/").filter(Boolean); // ["login", "contractor"]
    if (parts.length === 2) role = parts[1].toLowerCase();
  }

  //pulling user and pass from url
  const username = (urlObj.query.username || "").toString();
  const password = (urlObj.query.password || "").toString();

  //get one of the test users
  const record = USERS[role];
  if (!record) {
    return sendJson(res, 400, { success: false, message: "Unknown role.", redirect: null });
  }

  //check if it matches records
  if (username === record.user && password === record.pass) {
    return sendJson(res, 200, { success: true, message: "Login OK.", redirect: record.redirect });
  }

  return sendJson(res, 401, { success: false, message: "Invalid username or password.", redirect: null });
}

//server obj
const serverObj = http.createServer(function (req, res) {
  console.log("Request URL:", req.url);
  const urlObj = url.parse(req.url, true);

  //go to login
  if (urlObj.pathname === "/login" || urlObj.pathname.startsWith("/login/")) {
    return handleLogin(urlObj, res);
  }

  //static files path
  let filePath = path.join(__dirname, "public", urlObj.pathname);

  // Default to login.html
  if (urlObj.pathname === "/") {
    filePath = path.join(__dirname, "public", "login.html");
  }

  // error handlr if wrong url just in case for test forces loginpage
  try {
    const stat = fs.existsSync(filePath) && fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      filePath = path.join(filePath, "login.html");
    }
  } catch (_) { /* catch */ }

  sendFile(filePath, res);
});

serverObj.listen(80, function () {
  console.log("Server is listening on port 80");
});
