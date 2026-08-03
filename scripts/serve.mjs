import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "dist");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

const server = createServer((request, response) => {
  const rawPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const requested = rawPath === "/" ? "/index.html" : rawPath;
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, "");
  const file = join(root, safePath);
  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("No encontrado");
    return;
  }
  response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local URL: http://localhost:${port}`);
});
