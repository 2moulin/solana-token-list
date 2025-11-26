const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/tokens.json') {
    const filePath = path.join(__dirname, 'tokens.json');

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
  console.log(`📁 Serving tokens.json from: ${__dirname}`);
  console.log(`\n✅ Test URL: http://localhost:${PORT}/tokens.json`);
});
