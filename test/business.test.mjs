import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  budgetPolicy,
  canSpend,
  decideExperiment,
  estimateFee,
  getPaymentOptions,
  ledgerTotals,
  redactLedgerEvent,
  validatePaymentStack
} from "../public/assets/business.mjs";

const offers = [
  {
    slug: "conversion-audit",
    title: "Landing Page Conversion Audit",
    priceUsd: 39,
    paymentLinks: {
      square: "https://square.link/u/conversionAudit",
      paypal: "https://www.paypal.com/ncp/payment/conversionAudit",
      gumroad: ""
    }
  },
  {
    slug: "product-rewrite",
    title: "Product Page Rewrite Pack",
    priceUsd: 59,
    paymentLinks: {
      stripe: "https://example.com/blocked",
      paypal: "",
      gumroad: ""
    }
  }
];

describe("payment stack", () => {
  it("orders Square before PayPal and omits empty payment links", () => {
    const options = getPaymentOptions(offers[0]);

    assert.deepEqual(
      options.map((option) => option.platform),
      ["square", "paypal"]
    );
    assert.equal(options[0].url, "https://square.link/u/conversionAudit");
  });

  it("rejects Stripe-family payment URLs anywhere in the offer data", () => {
    const result = validatePaymentStack(offers);

    assert.equal(result.ok, false);
    assert.equal(result.violations.length, 1);
    assert.match(result.violations[0], /product-rewrite/);
    assert.match(result.violations[0], /stripe/i);
  });

  it("estimates processor fees and net revenue for approved processors", () => {
    assert.equal(estimateFee("square", 39), 1.59);
    assert.equal(estimateFee("paypal", 39), 1.85);
    assert.equal(estimateFee("gumroad", 39), 4.4);
  });
});

describe("budget guard", () => {
  it("keeps paid acquisition locked until an offer has organic signal", () => {
    const result = canSpend({
      amountUsd: 25,
      category: "paid_acquisition",
      organicSignal: false,
      spentTodayUsd: 0,
      spentTotalUsd: 20,
      spentOnOfferUsd: 0
    });

    assert.equal(result.allowed, false);
    assert.match(result.reason, /organic signal/i);
  });

  it("blocks spend beyond the daily and per-offer paid acquisition caps", () => {
    assert.equal(
      canSpend({
        amountUsd: 1,
        category: "paid_acquisition",
        organicSignal: true,
        spentTodayUsd: budgetPolicy.maxDailyPaidAcquisitionUsd,
        spentTotalUsd: 60,
        spentOnOfferUsd: 12
      }).allowed,
      false
    );

    assert.equal(
      canSpend({
        amountUsd: 15,
        category: "paid_acquisition",
        organicSignal: true,
        spentTodayUsd: 0,
        spentTotalUsd: 60,
        spentOnOfferUsd: 90
      }).allowed,
      false
    );
  });
});

describe("experiment decisions", () => {
  it("doubles down on any experiment with revenue", () => {
    assert.equal(
      decideExperiment({
        visits: 28,
        paymentClicks: 2,
        purchases: 1,
        revenueUsd: 39
      }).decision,
      "double_down"
    );
  });

  it("kills experiments with traffic but no buying intent", () => {
    const result = decideExperiment({
      visits: 180,
      paymentClicks: 1,
      purchases: 0,
      revenueUsd: 0
    });

    assert.equal(result.decision, "kill");
    assert.match(result.nextAction, /replace/i);
  });

  it("iterates checkout/copy when clicks happen but purchases do not", () => {
    const result = decideExperiment({
      visits: 124,
      paymentClicks: 7,
      purchases: 0,
      revenueUsd: 0
    });

    assert.equal(result.decision, "iterate");
    assert.match(result.nextAction, /checkout/i);
  });
});

describe("public ledger", () => {
  it("redacts emails, secrets, tokens, and card data from public events", () => {
    const publicEvent = redactLedgerEvent({
      title: "Payment confirmed for tessa@example.com",
      customerEmail: "tessa@example.com",
      secret: "sk_live_123",
      apiToken: "token_abc",
      cardLast4: "4242",
      nested: {
        buyerEmail: "founder@example.co"
      }
    });

    assert.equal(publicEvent.customerEmail, "[redacted]");
    assert.equal(publicEvent.secret, "[redacted]");
    assert.equal(publicEvent.apiToken, "[redacted]");
    assert.equal(publicEvent.cardLast4, "[redacted]");
    assert.equal(publicEvent.nested.buyerEmail, "[redacted]");
    assert.equal(publicEvent.title, "Payment confirmed for [redacted-email]");
  });

  it("calculates gross, fees, net, and spend from ledger events", () => {
    const totals = ledgerTotals([
      {
        type: "revenue",
        platform: "square",
        grossUsd: 39
      },
      {
        type: "spend",
        amountUsd: 12
      }
    ]);

    assert.deepEqual(totals, {
      grossRevenueUsd: 39,
      estimatedFeesUsd: 1.59,
      netRevenueUsd: 37.41,
      spendUsd: 12,
      profitUsd: 25.41
    });
  });
});
