import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolvePublicPath } from "../tools/serverPaths.mjs";

describe("static server paths", () => {
  it("resolves public files from directories whose absolute path contains spaces", () => {
    const result = resolvePublicPath({
      publicDir: "/tmp/Lets see what happens/public",
      requestUrl: "/ledger/",
      port: 4173
    });

    assert.equal(result, "/tmp/Lets see what happens/public/ledger/index.html");
    assert.doesNotMatch(result, /%20/);
  });

  it("falls back to the home page for unknown routes", () => {
    const result = resolvePublicPath({
      publicDir: "/tmp/Lets see what happens/public",
      requestUrl: "/unknown-page",
      port: 4173,
      exists: (filePath) => filePath.endsWith("/public/index.html")
    });

    assert.equal(result, "/tmp/Lets see what happens/public/index.html");
  });
});
