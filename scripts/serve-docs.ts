import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'docs');
const host = process.env.TUIUIU_DOCS_HOST || '127.0.0.1';
const requestedPort = Number(process.env.TUIUIU_DOCS_PORT || 3000);
if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65_535) {
  throw new Error('TUIUIU_DOCS_PORT must be an integer between 0 and 65535');
}

const mediaTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

createServer((request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = resolve(root, `.${pathname}`);
    const containment = relative(root, target);
    if (containment.startsWith(`..${sep}`) || containment === '..') {
      response.writeHead(403).end('Forbidden');
      return;
    }
    if (!statSync(target).isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': mediaTypes[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end('Not Found');
  }
}).listen(requestedPort, host, function onListen() {
  const address = this.address();
  const port = address && typeof address !== 'string' ? address.port : requestedPort;
  console.log(`Documentation: http://${host}:${port}`);
});
