import { existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

function defaultIsDirectory(filePath) {
  return existsSync(filePath) && statSync(filePath).isDirectory();
}

export function resolvePublicPath({
  publicDir,
  requestUrl,
  port,
  exists = () => true,
  isDirectory = defaultIsDirectory
}) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://localhost:${port}`).pathname);
  const safePath = normalize(pathname)
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .replace(/^[/\\]+/, "");
  let filePath = join(publicDir, safePath);

  if (pathname.endsWith("/") || isDirectory(filePath)) {
    filePath = join(filePath, "index.html");
  }

  if (!exists(filePath)) {
    filePath = join(publicDir, "index.html");
  }

  return filePath;
}
