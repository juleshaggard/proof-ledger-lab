import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePublicPath } from "./serverPaths.mjs";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

function resolveRequest(url) {
  return resolvePublicPath({
    publicDir,
    requestUrl: url,
    port,
    exists: existsSync,
    isDirectory: (filePath) => existsSync(filePath) && statSync(filePath).isDirectory()
  });
}

const server = createServer((request, response) => {
  const filePath = resolveRequest(request.url || "/");
  const type = contentTypes[extname(filePath)] || "application/octet-stream";

  response.writeHead(200, { "content-type": type });
  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Proof Ledger Lab local server running at http://localhost:${port}`);
});
