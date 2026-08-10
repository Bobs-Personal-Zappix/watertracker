import https from 'node:https';
import fs from 'node:fs';

export function startFakePushService() {
  const received = [];
  const options = {
    key: fs.readFileSync(new URL('./key.pem', import.meta.url)),
    cert: fs.readFileSync(new URL('./cert.pem', import.meta.url)),
  };
  const server = https.createServer(options, (req, res) => {
    let chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      received.push({ url: req.url, method: req.method, headers: req.headers, bodyLength: body.length });
      if (req.url.includes('/gone')) {
        res.writeHead(410, { 'Content-Type': 'text/plain' });
        res.end('Gone');
        return;
      }
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end('Created');
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, received });
    });
  });
}
