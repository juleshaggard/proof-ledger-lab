export const brand = {
  name: "Proof Ledger Lab",
  tagline: "Tiny paid offers, public accountability, zero Stripe dependency.",
  supportEmail: "replace-with-your-support-email@example.com",
  mailingAddress: "Replace with your business mailing address before outreach.",
  budgetUsd: 500
};

export const offers = [
  {
    slug: "conversion-audit",
    title: "Landing Page Conversion Audit",
    shortTitle: "Conversion Audit",
    priceUsd: 39,
    status: "active",
    audience: "Solo founders and local service teams with traffic but unclear conversion leaks.",
    promise: "A concise teardown of the page, the missed buying cues, and the three fixes most likely to move the next visitor closer to purchase.",
    turnaround: "Delivered within 24 hours after payment and intake.",
    primaryMetric: "Visitors to payment-link clicks",
    organicChannels: ["Founder communities", "SEO teardown posts", "Direct replies to public launch threads"],
    deliverables: [
      "Annotated page critique",
      "Priority fix list",
      "Replacement headline and call-to-action copy",
      "One follow-up experiment to run next"
    ],
    paymentLinks: {
      square: "https://square.link/u/REPLACE_CONVERSION_AUDIT",
      paypal: "https://www.paypal.com/ncp/payment/REPLACE_CONVERSION_AUDIT",
      gumroad: ""
    },
    metrics: {
      visits: 0,
      paymentClicks: 0,
      purchases: 0,
      revenueUsd: 0
    }
  },
  {
    slug: "local-seo-snapshot",
    title: "Local SEO Snapshot",
    shortTitle: "SEO Snapshot",
    priceUsd: 49,
    status: "active",
    audience: "Local businesses that need a fast read on why competitors show up before them.",
    promise: "A practical search visibility snapshot with the missing profile, review, and page signals that can be fixed without a full agency retainer.",
    turnaround: "Delivered within 24 hours after payment and intake.",
    primaryMetric: "Local-business visits to checkout intent",
    organicChannels: ["Google Business Profile forums", "Local business directories", "Owner-focused cold warm replies"],
    deliverables: [
      "Search presence summary",
      "Competitor comparison notes",
      "Google Business Profile action list",
      "Two page or listing copy improvements"
    ],
    paymentLinks: {
      square: "https://square.link/u/REPLACE_LOCAL_SEO_SNAPSHOT",
      paypal: "https://www.paypal.com/ncp/payment/REPLACE_LOCAL_SEO_SNAPSHOT",
      gumroad: ""
    },
    metrics: {
      visits: 0,
      paymentClicks: 0,
      purchases: 0,
      revenueUsd: 0
    }
  },
  {
    slug: "product-page-rewrite",
    title: "Product Page Rewrite Pack",
    shortTitle: "Rewrite Pack",
    priceUsd: 59,
    status: "active",
    audience: "Shopify, Gumroad, and creator-store operators with products that need clearer buying language.",
    promise: "A rewritten product page section set that makes the offer easier to understand, compare, and buy.",
    turnaround: "Delivered within 48 hours after payment and intake.",
    primaryMetric: "Offer-page visits to purchase",
    organicChannels: ["Creator commerce groups", "Indie maker launch replies", "Public rewrite examples"],
    deliverables: [
      "Rewritten hero section",
      "Benefit and objection copy",
      "Checkout call-to-action text",
      "A/B test recommendation"
    ],
    paymentLinks: {
      square: "https://square.link/u/REPLACE_PRODUCT_PAGE_REWRITE",
      paypal: "https://www.paypal.com/ncp/payment/REPLACE_PRODUCT_PAGE_REWRITE",
      gumroad: "https://gumroad.com/l/REPLACE_PRODUCT_PAGE_REWRITE"
    },
    metrics: {
      visits: 0,
      paymentClicks: 0,
      purchases: 0,
      revenueUsd: 0
    }
  }
];

export const setupChecklist = [
  {
    title: "Square payment links",
    status: "blocked_by_owner_setup",
    detail: "Create one Square link per offer, then replace the REPLACE_* URLs in public/assets/data.mjs."
  },
  {
    title: "PayPal Business fallback",
    status: "blocked_by_owner_setup",
    detail: "Create PayPal checkout links for buyers who prefer PayPal or Venmo."
  },
  {
    title: "GitHub repository and Pages",
    status: "complete",
    detail: "Repository, static checks, and GitHub Pages publishing are live."
  },
  {
    title: "Compliance identity",
    status: "blocked_by_owner_setup",
    detail: "Replace support email, business mailing address, and refund terms before outbound email."
  },
  {
    title: "Analytics",
    status: "ready_for_free_tooling",
    detail: "Use Cloudflare Web Analytics or GitHub Pages plus Search Console before buying traffic."
  }
];

export const ledgerEvents = [
  {
    id: "evt-001",
    type: "launch",
    time: "2026-06-25T09:18:00-07:00",
    title: "Week-one offer lab scaffolded",
    offer: "all",
    summary: "Created three paid experiments with Square-first checkout placeholders, PayPal fallback slots, Gumroad reserved for the digital rewrite pack, and no paid acquisition.",
    status: "complete",
    publicLink: "/"
  },
  {
    id: "evt-002",
    type: "spend",
    time: "2026-06-25T09:19:00-07:00",
    title: "Spend held at zero",
    offer: "all",
    amountUsd: 0,
    vendor: "none",
    summary: "Free-first launch remains within the initial budget. No ads, paid SaaS, or domain purchase has been made.",
    status: "complete",
    publicLink: "/ledger/"
  },
  {
    id: "evt-003",
    type: "revenue",
    time: "2026-06-25T09:20:00-07:00",
    title: "Revenue awaiting payment setup",
    offer: "all",
    platform: "square",
    grossUsd: 0,
    summary: "Revenue stays at zero until user-owned Square or PayPal links are connected and a confirmed payment arrives.",
    status: "waiting_on_owner",
    publicLink: "/intake/"
  },
  {
    id: "evt-004",
    type: "blocker",
    time: "2026-06-25T09:21:00-07:00",
    title: "Payment account ownership required",
    offer: "all",
    summary: "Square, PayPal, banking, tax, KYC, and MFA must be completed by the account owner. The site is ready to accept links once they exist.",
    status: "blocked_by_owner_setup",
    publicLink: "/ledger/"
  },
  {
    id: "evt-005",
    type: "github",
    time: "2026-06-25T09:22:00-07:00",
    title: "GitHub packaging added",
    offer: "all",
    summary: "Added test scripts, static hosting structure, GitHub Actions checks, and Pages publishing.",
    status: "complete",
    publicLink: "https://github.com/juleshaggard/proof-ledger-lab"
  },
  {
    id: "evt-006",
    type: "launch",
    time: "2026-06-25T09:26:00-07:00",
    title: "GitHub Pages deployment verified",
    offer: "all",
    summary: "Published the static experiment lab and verified the live home, ledger, and offer subpages render without console errors.",
    status: "complete",
    publicLink: "https://juleshaggard.github.io/proof-ledger-lab/"
  }
];

export const experimentCadence = [
  "Launch three small paid offers before any paid ads.",
  "Measure visits, payment-link clicks, purchases, replies, refunds, and fulfillment time.",
  "Kill offers with traffic but no buying intent.",
  "Iterate offers with clicks but no purchases.",
  "Double down only after revenue or strong purchase intent."
];

export const sources = [
  {
    label: "Square Payment Links",
    url: "https://squareup.com/us/en/payment-links"
  },
  {
    label: "PayPal merchant fees",
    url: "https://www.paypal.com/us/business/paypal-business-fees"
  },
  {
    label: "Gumroad pricing",
    url: "https://gumroad.com/pricing"
  },
  {
    label: "Cloudflare Web Analytics",
    url: "https://www.cloudflare.com/web-analytics/"
  },
  {
    label: "Google Search Console",
    url: "https://search.google.com/search-console/about"
  }
];
