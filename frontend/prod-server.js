const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3030;
const HOST = process.env.HOST || 'localhost';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // For React Router SPA - serve index.html for all non-static routes
  if (!req.url.startsWith('/static/') &&
      !req.url.startsWith('/asset-manifest.json') &&
      !req.url.startsWith('/manifest.json') &&
      !req.url.startsWith('/favicon') &&
      !req.url.startsWith('/service-worker.js') &&
      !req.url.startsWith('/precache-manifest')) {

    // Serve the built React app
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Server Error</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  // Serve static files from build directory
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'build', filePath);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file not found, serve index.html for SPA routing
      const indexPath = path.join(__dirname, 'build', 'index.html');
      fs.readFile(indexPath, (err, content) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>Server Error</h1>');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
      return;
    }

    // Get file extension
    const extname = path.extname(filePath);

    // Set content type based on file extension
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }

    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Server Error</h1>');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`VeloTicket app running at http://${HOST}:${PORT}`);
  console.log(`Serving built React app from build directory`);
});