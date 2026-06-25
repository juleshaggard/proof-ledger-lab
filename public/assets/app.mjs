import {
  canSpend,
  decideExperiment,
  getCheckoutState,
  getPaymentOptions,
  ledgerTotals,
  redactLedgerEvent
} from "./business.mjs";
import { brand, experimentCadence, ledgerEvents, offers, setupChecklist, sources } from "./data.mjs";

const app = document.querySelector("#app");
const page = document.body.dataset.page || "home";
const depth = Number(document.body.dataset.depth || 0);
const offerSlug = document.body.dataset.offer || "";

function pathFor(path) {
  const prefix = "../".repeat(depth);
  const cleanPath = path.replace(/^\//, "");
  return cleanPath ? `${prefix}${cleanPath}` : prefix || "./";
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function track(eventName, payload = {}) {
  const key = "proof-ledger-events";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  current.push({
    eventName,
    payload,
    time: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(current.slice(-80)));
}

function nav() {
  return `
    <header class="site-header">
      <a class="brand-mark" href="${pathFor("/")}" aria-label="${brand.name} home">
        <span class="brand-symbol"></span>
        <span>${brand.name}</span>
      </a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a href="${pathFor("/ledger/")}">Ledger</a>
        <a href="${pathFor("/intake/")}">Intake</a>
        <a href="${pathFor("/reports/sample/")}">Sample</a>
      </nav>
    </header>
  `;
}

function shell(content) {
  app.innerHTML = `
    ${nav()}
    ${content}
    <footer class="site-footer">
      <div>
        <strong>${brand.name}</strong>
        <p>${brand.tagline}</p>
      </div>
      <div class="footer-links">
        ${sources.map((source) => `<a href="${source.url}" rel="noreferrer">${source.label}</a>`).join("")}
      </div>
    </footer>
  `;
}

function statusPill(status) {
  return `<span class="status-pill" data-status="${escapeHtml(status)}">${escapeHtml(status.replaceAll("_", " "))}</span>`;
}

function renderOperationsVisual() {
  const rows = offers
    .map((offer, index) => {
      const decision = decideExperiment(offer.metrics);
      return `
        <li style="--row-index:${index}">
          <span>${escapeHtml(offer.shortTitle)}</span>
          <strong>${escapeHtml(decision.decision.replaceAll("_", " "))}</strong>
          <i>${money(offer.metrics.revenueUsd)}</i>
        </li>
      `;
    })
    .join("");

  return `
    <section class="ops-visual" aria-label="Experiment operations preview">
      <div class="ops-topline">
        <span>Live offer board</span>
        <strong>$0 spent</strong>
      </div>
      <div class="signal-grid">
        <div>
          <span>Budget</span>
          <strong>${money(brand.budgetUsd)}</strong>
        </div>
        <div>
          <span>Offers</span>
          <strong>${offers.length}</strong>
        </div>
        <div>
          <span>Ads</span>
          <strong>Locked</strong>
        </div>
      </div>
      <ol class="ops-rows">${rows}</ol>
    </section>
  `;
}

function renderHome() {
  const offerCards = offers
    .map((offer) => {
      const checkout = getCheckoutState(offer);
      const decision = decideExperiment(offer.metrics);

      return `
        <article class="offer-card">
          <div>
            ${statusPill(offer.status)}
            <h3>${escapeHtml(offer.title)}</h3>
            <p>${escapeHtml(offer.promise)}</p>
          </div>
          <dl class="offer-facts">
            <div><dt>Price</dt><dd>${money(offer.priceUsd)}</dd></div>
            <div><dt>Signal</dt><dd>${escapeHtml(decision.decision.replaceAll("_", " "))}</dd></div>
            <div><dt>Checkout</dt><dd>${checkout.ready ? "Ready" : "Needs links"}</dd></div>
          </dl>
          <a class="text-link" href="${pathFor(`/offers/${offer.slug}/`)}">Open offer</a>
        </article>
      `;
    })
    .join("");

  shell(`
    <main>
      <section class="hero-section">
        <div class="hero-copy">
          <span class="eyebrow">Free-tool-first revenue lab</span>
          <h1>Launch small paid offers, keep the ledger public, and move money only after signal.</h1>
          <p>${brand.tagline} The first build ships three experiments, payment-link slots, an intake path, and rules that stop spend before the data earns it.</p>
          <div class="hero-actions">
            <a class="primary-action" href="${pathFor("/ledger/")}">View public ledger</a>
            <a class="secondary-action" href="${pathFor("/intake/")}">Open intake</a>
          </div>
        </div>
        ${renderOperationsVisual()}
      </section>

      <section class="content-band">
        <div class="section-heading">
          <span class="eyebrow">Week one experiments</span>
          <h2>Three offers, one rule: no paid push until intent appears.</h2>
        </div>
        <div class="offer-grid">${offerCards}</div>
      </section>

      <section class="split-band">
        <div>
          <span class="eyebrow">Operating cadence</span>
          <h2>Kill weak ideas fast. Improve what buyers touch.</h2>
        </div>
        <ol class="cadence-list">
          ${experimentCadence.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
        </ol>
      </section>

      <section class="setup-strip">
        ${setupChecklist.map((item) => `
          <article>
            ${statusPill(item.status)}
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.detail)}</p>
          </article>
        `).join("")}
      </section>
    </main>
  `);
}

function paymentButtons(offer) {
  const checkout = getCheckoutState(offer);
  const allOptions = getPaymentOptions(offer);

  if (!checkout.ready) {
    return `
      <div class="checkout-panel" data-state="blocked">
        <p>${escapeHtml(checkout.reason)}</p>
        <button class="primary-action" type="button" disabled>Payment links needed</button>
        <a class="secondary-action" href="${pathFor(`/intake/?offer=${offer.slug}`)}">Prepare intake draft</a>
        <ul>
          ${allOptions.map((option) => `<li>${escapeHtml(option.label)} slot: replace configured URL before launch.</li>`).join("")}
        </ul>
      </div>
    `;
  }

  return `
    <div class="checkout-panel">
      ${checkout.options.map((option, index) => `
        <a class="${index === 0 ? "primary-action" : "secondary-action"}" href="${option.url}" data-track-payment="${option.platform}" data-offer="${offer.slug}">
          Pay with ${escapeHtml(option.label)}
        </a>
      `).join("")}
      <a class="text-link" href="${pathFor(`/intake/?offer=${offer.slug}`)}">Submit intake after payment</a>
    </div>
  `;
}

function renderOffer() {
  const offer = offers.find((item) => item.slug === offerSlug) || offers[0];
  const decision = decideExperiment(offer.metrics);
  const spendCheck = canSpend({
    amountUsd: 25,
    category: "paid_acquisition",
    organicSignal: offer.metrics.paymentClicks > 0 || offer.metrics.purchases > 0,
    spentTodayUsd: 0,
    spentTotalUsd: 0,
    spentOnOfferUsd: 0
  });

  shell(`
    <main>
      <section class="offer-hero">
        <div>
          <a class="text-link" href="${pathFor("/")}">Back to offers</a>
          <span class="eyebrow">${escapeHtml(offer.audience)}</span>
          <h1>${escapeHtml(offer.title)}</h1>
          <p>${escapeHtml(offer.promise)}</p>
          <dl class="price-block">
            <div><dt>Price</dt><dd>${money(offer.priceUsd)}</dd></div>
            <div><dt>Turnaround</dt><dd>${escapeHtml(offer.turnaround)}</dd></div>
            <div><dt>Paid traffic</dt><dd>${spendCheck.allowed ? "Available" : "Locked"}</dd></div>
          </dl>
        </div>
        ${paymentButtons(offer)}
      </section>

      <section class="split-band">
        <div>
          <span class="eyebrow">Deliverables</span>
          <h2>Small enough to fulfill quickly. Specific enough to sell.</h2>
        </div>
        <ul class="deliverable-list">
          ${offer.deliverables.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>

      <section class="content-band">
        <div class="section-heading">
          <span class="eyebrow">Experiment read</span>
          <h2>${escapeHtml(decision.decision.replaceAll("_", " "))}</h2>
          <p>${escapeHtml(decision.nextAction)}</p>
        </div>
        <div class="channel-row">
          ${offer.organicChannels.map((channel) => `<span>${escapeHtml(channel)}</span>`).join("")}
        </div>
      </section>
    </main>
  `);
}

function renderLedger() {
  const publicEvents = ledgerEvents.map((event) => redactLedgerEvent(event));
  const totals = ledgerTotals(publicEvents);

  shell(`
    <main>
      <section class="ledger-hero">
        <div>
          <span class="eyebrow">Public action ledger</span>
          <h1>Every experiment move, spend decision, blocker, and revenue event goes here.</h1>
        </div>
        <div class="totals-grid">
          <div><span>Gross revenue</span><strong>${money(totals.grossRevenueUsd)}</strong></div>
          <div><span>Estimated fees</span><strong>${money(totals.estimatedFeesUsd)}</strong></div>
          <div><span>Spend</span><strong>${money(totals.spendUsd)}</strong></div>
          <div><span>Profit</span><strong>${money(totals.profitUsd)}</strong></div>
        </div>
      </section>
      <section class="ledger-list">
        ${publicEvents.map((event) => `
          <article>
            <time datetime="${escapeHtml(event.time)}">${new Date(event.time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
            <div>
              ${statusPill(event.status)}
              <h2>${escapeHtml(event.title)}</h2>
              <p>${escapeHtml(event.summary)}</p>
              <dl>
                <div><dt>Type</dt><dd>${escapeHtml(event.type)}</dd></div>
                <div><dt>Offer</dt><dd>${escapeHtml(event.offer)}</dd></div>
                <div><dt>Amount</dt><dd>${money(event.amountUsd || event.grossUsd || 0)}</dd></div>
              </dl>
            </div>
          </article>
        `).join("")}
      </section>
    </main>
  `);
}

function renderIntake() {
  const options = offers
    .map((offer) => `<option value="${offer.slug}">${escapeHtml(offer.title)}</option>`)
    .join("");

  shell(`
    <main>
      <section class="form-shell">
        <div>
          <span class="eyebrow">Customer intake</span>
          <h1>Collect the details needed to fulfill only after confirmed payment.</h1>
          <p>This static form creates a support-email draft for v1. Replace the support email and connect a free form tool when payment links go live.</p>
        </div>
        <form id="intake-form" class="intake-form" novalidate>
          <label>
            <span>Offer</span>
            <select name="offer">${options}</select>
          </label>
          <label>
            <span>Website or product URL</span>
            <input name="url" type="url" placeholder="https://example.com" required>
            <small>Required for audits, snapshots, and rewrites.</small>
          </label>
          <label>
            <span>Buyer email</span>
            <input name="email" type="email" placeholder="founder@example.com" required>
            <small>Used only for delivery and support.</small>
          </label>
          <label>
            <span>Payment reference</span>
            <input name="paymentReference" type="text" placeholder="Square or PayPal receipt id">
            <small>Fulfillment starts after payment is confirmed.</small>
          </label>
          <label>
            <span>What should the report focus on?</span>
            <textarea name="notes" rows="5" placeholder="Tell us what changed, what is not converting, or what competitors worry you."></textarea>
          </label>
          <div class="form-actions">
            <button class="primary-action" type="submit">Create intake email</button>
            <p id="form-status" role="status"></p>
          </div>
        </form>
      </section>
    </main>
  `);

  const params = new URLSearchParams(window.location.search);
  const selectedOffer = params.get("offer");
  if (selectedOffer) {
    const select = document.querySelector("select[name='offer']");
    select.value = selectedOffer;
  }

  document.querySelector("#intake-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#form-status");
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.url || !data.email) {
      status.textContent = "Add a website URL and buyer email before creating the intake draft.";
      status.dataset.state = "error";
      return;
    }

    const subject = encodeURIComponent(`Paid intake: ${data.offer}`);
    const body = encodeURIComponent(
      `Offer: ${data.offer}\nWebsite: ${data.url}\nBuyer email: ${data.email}\nPayment reference: ${data.paymentReference || "pending"}\n\nFocus:\n${data.notes || ""}`
    );
    const mailto = `mailto:${brand.supportEmail}?subject=${subject}&body=${body}`;

    track("intake_email_created", { offer: data.offer });
    status.innerHTML = `<a class="text-link" href="${mailto}">Open support email draft</a>`;
    status.dataset.state = "success";
  });
}

function renderReport() {
  shell(`
    <main>
      <section class="report-shell">
        <div>
          <span class="eyebrow">Sample deliverable</span>
          <h1>Conversion Audit sample report</h1>
          <p>A compact example of what a paid customer receives after payment and intake are confirmed.</p>
        </div>
        <article class="report-card">
          <h2>Priority fixes</h2>
          <ol>
            <li>Lead with the buyer's concrete pain before naming the service.</li>
            <li>Move proof above the first pricing mention.</li>
            <li>Replace vague button copy with the outcome the buyer gets next.</li>
          </ol>
        </article>
        <article class="report-card">
          <h2>Replacement copy</h2>
          <p class="copy-sample">Find the leak in your offer page before you buy another click.</p>
        </article>
      </section>
    </main>
  `);
}

function attachPaymentTracking() {
  document.querySelectorAll("[data-track-payment]").forEach((link) => {
    link.addEventListener("click", () => {
      track("payment_link_click", {
        platform: link.dataset.trackPayment,
        offer: link.dataset.offer
      });
    });
  });
}

if (page === "home") {
  renderHome();
} else if (page === "offer") {
  renderOffer();
} else if (page === "ledger") {
  renderLedger();
} else if (page === "intake") {
  renderIntake();
} else if (page === "report") {
  renderReport();
}

attachPaymentTracking();
