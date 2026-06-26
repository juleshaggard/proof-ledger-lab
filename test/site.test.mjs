import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { ledgerEvents, offers, setupChecklist, sources } from "../public/assets/data.mjs";
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

  it("links GitHub ledger events to the actual repository instead of the GitHub home page", () => {
    const githubEvent = ledgerEvents.find((event) => event.type === "github");

    assert.ok(githubEvent);
    assert.match(githubEvent.publicLink, /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/);
  });

  it("lists the free analytics and search-console sources named in the setup guidance", () => {
    const sourceLabels = sources.map((source) => source.label);

    assert.ok(sourceLabels.includes("Cloudflare Web Analytics"));
    assert.ok(sourceLabels.includes("Google Search Console"));
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

  it("lets the Pages workflow enable GitHub Pages on first deploy", () => {
    const workflow = readFileSync(".github/workflows/pages.yml", "utf8");

    assert.match(workflow, /enablement:\s*true/);
  });

  it("keeps blocked checkout copy explicit without implying checkout is live", () => {
    const appModule = readFileSync("public/assets/app.mjs", "utf8");

    assert.match(appModule, /Payment links needed/);
    assert.doesNotMatch(appModule, /Square link needed/);
  });

  it("derives the home operations snapshot from the shared ledger and budget policy", () => {
    const appModule = readFileSync("public/assets/app.mjs", "utf8");

    assert.match(appModule, /const totals = ledgerTotals\(ledgerEvents\);/);
    assert.match(appModule, /money\(budgetPolicy\.totalBudgetUsd\)/);
    assert.match(appModule, /money\(totals\.spendUsd\).*spent/);
  });

  it("keeps intake draft creation blocked until the support inbox is configured", () => {
    const appModule = readFileSync("public/assets/app.mjs", "utf8");

    assert.match(appModule, /Support inbox setup needed/);
    assert.match(appModule, /Replace the support email before creating intake drafts\./);
  });
});
