const forbiddenPaymentPatterns = [
  /stripe/i,
  /lemon\s*squeezy/i,
  /lemonsqueezy/i
];

export const budgetPolicy = {
  totalBudgetUsd: 500,
  initialSetupCapUsd: 30,
  aiSpendCapUsd: 25,
  maxDailyPaidAcquisitionUsd: 25,
  maxOfferPaidTestUsd: 100,
  paidAcquisitionRequiresSignal: true
};

const feeRules = {
  square: { percent: 0.033, fixedUsd: 0.3 },
  paypal: { percent: 0.0349, fixedUsd: 0.49 },
  gumroad: { percent: 0.1, fixedUsd: 0.5 }
};

const paymentLabels = {
  square: "Square",
  paypal: "PayPal",
  gumroad: "Gumroad"
};

const paymentOrder = ["square", "paypal", "gumroad"];

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isConfiguredUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  return /^https?:\/\//i.test(url) && !/replace|pending|example/i.test(url);
}

function containsForbiddenProcessor(value) {
  return forbiddenPaymentPatterns.some((pattern) => pattern.test(String(value)));
}

function redactString(value) {
  return String(value).replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "[redacted-email]"
  );
}

function isSensitiveKey(key) {
  return /(email|secret|token|api[-_]?key|password|card|mfa|otp|auth)/i.test(key);
}

export function estimateFee(platform, grossUsd) {
  const rule = feeRules[platform];
  if (!rule) {
    throw new Error(`Unsupported payment platform: ${platform}`);
  }

  if (grossUsd <= 0) {
    return 0;
  }

  return roundMoney(grossUsd * rule.percent + rule.fixedUsd);
}

export function getPaymentOptions(offer) {
  return paymentOrder
    .map((platform) => ({
      platform,
      label: paymentLabels[platform],
      url: offer.paymentLinks?.[platform] || "",
      feePreviewUsd: estimateFee(platform, offer.priceUsd || 0)
    }))
    .filter((option) => option.url);
}

export function validatePaymentStack(offers) {
  const violations = [];

  for (const offer of offers) {
    for (const [platform, url] of Object.entries(offer.paymentLinks || {})) {
      if (!url) {
        continue;
      }

      if (containsForbiddenProcessor(platform) || containsForbiddenProcessor(url)) {
        violations.push(`${offer.slug}: ${platform} uses forbidden processor URL ${url}`);
      }
    }
  }

  return {
    ok: violations.length === 0,
    violations
  };
}

export function getCheckoutState(offer) {
  const options = getPaymentOptions(offer).filter((option) => isConfiguredUrl(option.url));

  if (options.length === 0) {
    return {
      ready: false,
      primary: null,
      options,
      reason: "Payment links are waiting on user-owned Square or PayPal setup."
    };
  }

  return {
    ready: true,
    primary: options[0],
    options,
    reason: ""
  };
}

export function canSpend({
  amountUsd,
  category,
  organicSignal,
  spentTodayUsd,
  spentTotalUsd,
  spentOnOfferUsd
}) {
  if (amountUsd <= 0) {
    return { allowed: false, reason: "Spend amount must be greater than zero." };
  }

  if (spentTotalUsd + amountUsd > budgetPolicy.totalBudgetUsd) {
    return { allowed: false, reason: "This would exceed the total $500 budget cap." };
  }

  if (category === "initial_setup" && spentTotalUsd + amountUsd > budgetPolicy.initialSetupCapUsd) {
    return { allowed: false, reason: "Initial setup spend is capped at $30." };
  }

  if (category === "paid_acquisition") {
    if (budgetPolicy.paidAcquisitionRequiresSignal && !organicSignal) {
      return {
        allowed: false,
        reason: "Paid acquisition stays locked until an offer has organic signal."
      };
    }

    if (spentTodayUsd + amountUsd > budgetPolicy.maxDailyPaidAcquisitionUsd) {
      return { allowed: false, reason: "This would exceed the $25 daily paid acquisition cap." };
    }

    if (spentOnOfferUsd + amountUsd > budgetPolicy.maxOfferPaidTestUsd) {
      return { allowed: false, reason: "This would exceed the $100 per-offer paid test cap." };
    }
  }

  return { allowed: true, reason: "Spend is inside the current guardrails." };
}

export function decideExperiment({ visits, paymentClicks, purchases, revenueUsd }) {
  if (purchases > 0 || revenueUsd > 0) {
    return {
      decision: "double_down",
      nextAction: "Improve the winning offer page, add one distribution channel, and preserve the checkout path."
    };
  }

  if (visits >= 100 && paymentClicks >= 3) {
    return {
      decision: "iterate",
      nextAction: "Tighten the promise, price, and checkout friction before buying traffic."
    };
  }

  if (visits >= 150 && paymentClicks < 3) {
    return {
      decision: "kill",
      nextAction: "Replace the offer with a new pain point and keep spend at zero."
    };
  }

  return {
    decision: "keep_testing",
    nextAction: "Keep collecting free traffic until there is enough signal to judge."
  };
}

export function redactLedgerEvent(event) {
  if (Array.isArray(event)) {
    return event.map((item) => redactLedgerEvent(item));
  }

  if (event && typeof event === "object") {
    return Object.fromEntries(
      Object.entries(event).map(([key, value]) => [
        key,
        isSensitiveKey(key) ? "[redacted]" : redactLedgerEvent(value)
      ])
    );
  }

  if (typeof event === "string") {
    return redactString(event);
  }

  return event;
}

export function ledgerTotals(events) {
  const totals = events.reduce(
    (accumulator, event) => {
      if (event.type === "revenue") {
        const grossUsd = Number(event.grossUsd || 0);
        const feeUsd = estimateFee(event.platform, grossUsd);

        accumulator.grossRevenueUsd += grossUsd;
        accumulator.estimatedFeesUsd += feeUsd;
        accumulator.netRevenueUsd += grossUsd - feeUsd;
      }

      if (event.type === "spend") {
        accumulator.spendUsd += Number(event.amountUsd || 0);
      }

      return accumulator;
    },
    {
      grossRevenueUsd: 0,
      estimatedFeesUsd: 0,
      netRevenueUsd: 0,
      spendUsd: 0
    }
  );

  return {
    grossRevenueUsd: roundMoney(totals.grossRevenueUsd),
    estimatedFeesUsd: roundMoney(totals.estimatedFeesUsd),
    netRevenueUsd: roundMoney(totals.netRevenueUsd),
    spendUsd: roundMoney(totals.spendUsd),
    profitUsd: roundMoney(totals.netRevenueUsd - totals.spendUsd)
  };
}
