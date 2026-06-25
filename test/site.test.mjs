import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { ledgerEvents, offers, setupChecklist } from "../public/assets/data.mjs";
import { validatePaymentStack } from "../public/assets/business.mjs";

describe("launch site data", () => {
  it("launches exactly three week-one paid experiments", () => {
    assert.equal(offers.length, 3);
    assert.deepEqual(
      offers.map((offer) => offer.slug),
      ["conversion-audit", "local-seo-snapshot", "product-page-rewrite"]
    );
    assert.ok(offers.every((offer) => offer.priceUsd > 0));
  });

  it("keeps forbidden payment processors out of public offer data", () => {
    assert.equal(validatePaymentStack(offers).ok, true);
  });

  it("documents the user-owned payment and GitHub setup blockers", () => {
    assert.ok(setupChecklist.some((item) => /Square/i.test(item.title)));
    assert.ok(setupChecklist.some((item) => /PayPal/i.test(item.title)));
    assert.ok(setupChecklist.some((item) => /GitHub/i.test(item.title)));
  });

  it("ships a public ledger with spend, revenue, launch, and blocker events", () => {
    const eventTypes = new Set(ledgerEvents.map((event) => event.type));

    assert.ok(eventTypes.has("launch"));
    assert.ok(eventTypes.has("spend"));
    assert.ok(eventTypes.has("revenue"));
    assert.ok(eventTypes.has("blocker"));
  });
});

describe("static site files", () => {
  const expectedFiles = [
    "public/index.html",
    "public/ledger/index.html",
    "public/intake/index.html",
    "public/offers/conversion-audit/index.html",
    "public/offers/local-seo-snapshot/index.html",
    "public/offers/product-page-rewrite/index.html",
    "public/reports/sample/index.html",
    ".github/workflows/static-check.yml",
    "README.md"
  ];

  for (const filePath of expectedFiles) {
    it(`includes ${filePath}`, () => {
      assert.equal(existsSync(filePath), true);
    });
  }

  it("renders no direct Stripe or Lemon Squeezy links in public HTML", () => {
    const html = expectedFiles
      .filter((filePath) => filePath.endsWith(".html"))
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");

    assert.doesNotMatch(html, /https?:\/\/[^"']*(stripe|lemonsqueezy|lemon-squeezy)/i);
  });
});
