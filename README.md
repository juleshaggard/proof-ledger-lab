# Proof Ledger Lab

Proof Ledger Lab is a static, free-tool-first revenue experiment site. It launches three tiny paid offers, publishes a public action/spend/revenue ledger, and keeps paid acquisition locked until there is organic signal.

## What is included

- Three week-one paid offer pages.
- Square-first payment-link slots, PayPal fallback slots, and Gumroad reserved for the digital rewrite experiment.
- A static customer intake page that creates a support-email draft.
- A public ledger page for launch actions, spend, revenue, and blockers.
- Node test coverage for no-Stripe payment rules, budget guards, experiment decisions, ledger redaction, and static site packaging.
- GitHub Actions checks and a GitHub Pages deploy workflow.

## What you must configure

1. Create Square payment links in your own Square account.
2. Create PayPal Business checkout links in your own PayPal account.
3. Replace the `REPLACE_*` URLs in `public/assets/data.mjs`.
4. Replace `brand.supportEmail` and `brand.mailingAddress` in `public/assets/data.mjs`.

GitHub Pages is enabled for this repository at `https://juleshaggard.github.io/proof-ledger-lab/`. If this project is forked or recreated under a new repository, enable Pages with GitHub Actions as the source.

No card numbers, passwords, MFA codes, tax details, or bank details belong in this repository.

## Local commands

```bash
npm test
npm run serve
```

The local site runs at `http://localhost:4173`.

## Budget posture

Initial spend is intentionally held at `$0`. Paid acquisition remains blocked until an offer has organic visits, payment-link clicks, replies, or revenue.
