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



const serverObj = http.createServer(function (req, res) {
    console.log("Request URL:", req.url);
    const urlObj = url.parse(req.url, true);

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
