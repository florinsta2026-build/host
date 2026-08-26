# Florinsta.ae — E-commerce Platform

Luxury florist e-commerce platform for Dubai/UAE. Next.js 16 (App Router) + TypeScript +
Prisma/PostgreSQL + NextAuth + Ziina payments.

## Status — read this first

This project was built in a sandboxed environment with no network access to
`binaries.prisma.sh` (Prisma's engine download host) or a live PostgreSQL server. That means:

- `npx prisma generate`, `npx prisma migrate dev`, and `npm run build` have not been run
  successfully end-to-end here. The Prisma schema was written and checked by hand; the
  application code was typechecked and linted, and every error that came up traced back to
  the missing generated Prisma client, confirmed individually. None were logic bugs.
- The one part of the stack that doesn't need a live database — the unit test suite — was
  actually run, and passes: 24/24 tests (money/currency math, coupon pricing and validation
  rules, checkout input validation). Run `npm test` yourself to reproduce.
- The Ziina payment integration is built against Ziina's real, current public API docs
  (docs.ziina.com), not guessed — but it has not been exercised against a live Ziina sandbox
  account, because no credentials exist for this project yet.

Before you call this "production ready", run the steps below yourself — `npm install`,
`npx prisma generate`, `npx prisma migrate dev`, `npm run build` — in an environment with
normal internet access, and fix anything that comes up. It should be close, but this hasn't
been proven end-to-end.

## What's implemented

- Storefront: homepage, shop/category browsing, product detail pages (with JSON-LD), cart,
  multi-section checkout, order confirmation (secure token), order tracking (order number +
  email/phone, never a bare sequential ID)
- Full Prisma schema: products/options/inventory, orders with price snapshots, payments,
  webhook idempotency ledger, coupons, delivery zones/slots, audit log, site settings
- Checkout: server-side re-pricing of every line item, stock reservation inside a DB
  transaction, server-side coupon validation, delivery slot capacity checks
- Ziina payment abstraction: payment intent creation, webhook signature verification (HMAC
  SHA-256), idempotent webhook processing, verifyPayment() re-confirms with Ziina directly
  before crediting an order — the webhook body alone is never trusted
- Admin: NextAuth credentials login (bcrypt, rate-limited), role-gated (ADMIN/STAFF)
  dashboard, orders (search/filter/status-change/notes/audit log/packing slip), products
  (price/availability/featured), inventory (view + manual adjustment), customers, coupons,
  delivery/site settings, sales reports with CSV export
- Cron-ready endpoint to release stock reservations from abandoned checkouts
- 57 real products seeded from your original site's exact data (extracted programmatically,
  not retyped, to avoid transcription errors)

## What's NOT implemented yet

- Order-status transactional emails beyond the "paid" confirmation (preparing/out-for-delivery/
  delivered/cancelled) — the email abstraction supports it, templates aren't written
- Tabby/Stripe payment providers (the abstraction is ready for them)
- Integration/E2E tests (only unit tests exist)
- A production Content-Security-Policy header (basic security headers are set in middleware;
  CSP needs your final list of any third-party scripts before it can be written correctly)
- WhatsApp Business API notifications (the WhatsApp click-to-chat link works everywhere
  already; a true API integration needs a WhatsApp Business Platform account)

## Requirements

- Node.js 20+
- A PostgreSQL database (Supabase recommended — see below)
- A Ziina merchant account (sandbox is enough to start)
- (Optional to start) A transactional email provider account (Resend recommended)

## 1. Local installation

```bash
npm install
cp .env.example .env.local
# fill in .env.local — see "Environment variables" below
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Visit http://localhost:3000 for the storefront and http://localhost:3000/admin/login for
admin (you won't have an admin account until you create one — see step 5).

## 2. Environment variables

All variables are documented in `.env.example`. Summary of what's required vs optional:

**Required to run at all:**
- `DATABASE_URL`, `DIRECT_URL` — your Postgres connection strings
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_SITE_URL`

**Required to accept payments:**
- `PAYMENT_PROVIDER=ziina`
- `PAYMENT_SECRET_KEY` — Ziina merchant dashboard, Developers > API keys
- `PAYMENT_WEBHOOK_SECRET` — the secret you set when registering your Ziina webhook (step 6)

**Optional (site works without them, with reduced functionality):**
- `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` — without these, emails are logged to the
  server console instead of sent (see lib/email/send.ts)
- `STORAGE_*` — only needed once you're uploading new product images through an admin UI
  (not yet built — for now, images live in /public/assets)
- `CRON_SECRET` — protects the stale-reservation cleanup endpoint; strongly recommended in
  production but the app runs without it

## 3. Database — Supabase (recommended)

1. Create a project at supabase.com
2. Project Settings > Database > Connection string:
   - Use the Transaction pooler (port 6543) connection string for `DATABASE_URL`, and append
     `?pgbouncer=true`
   - Use the Session/direct connection string (port 5432) for `DIRECT_URL`
3. Run `npx prisma migrate dev --name init` locally once to create the schema, then
   `npx prisma migrate deploy` in CI/production for subsequent migrations

(Neon is documented as an equivalent alternative — same two-URL pattern with pooled vs direct.)

## 4. Seed the database

```bash
npm run seed
```

This creates the two categories, all 57 products with inventory records, one Dubai delivery
zone (fee: placeholder AED 30 — confirm the real fee with the business), three delivery slots,
and site settings (free delivery threshold AED 300, tax rate 0%, same-day cutoff 3pm — all
placeholders, confirm with the business).

## 5. Create your first admin account

The seed script will create one if you set these before running `npm run seed`:

```bash
SEED_ADMIN_EMAIL="you@florinstauae.com" SEED_ADMIN_PASSWORD="a-strong-password" npm run seed
```

No admin password is ever hard-coded in this repo.

## 6. Ziina payment setup

1. Sign up / log in at ziina.com, get API access from the merchant dashboard
2. Copy your secret key into `PAYMENT_SECRET_KEY`
3. Register a webhook: POST to `https://api-v2.ziina.com/api/webhook` with
   `{ "url": "https://yourdomain.com/api/webhooks/ziina", "secret": "<a-secret-you-generate>" }`
   — put that same secret in `PAYMENT_WEBHOOK_SECRET`
4. Test with `test: true` on payment intents (any card number/expiry/CVV works, no real charge)
5. To test a failed payment, use Ziina's documented test failure flow (confirm current test
   values in their docs, they can change)
6. To test duplicate webhooks: re-send the same webhook payload twice — the second call should
   return `{ "duplicate": true }` and not double-process the order

## 7. Email setup (optional but recommended)

Sign up at resend.com, verify your sending domain, put the API key in `EMAIL_API_KEY`. Without
this, order confirmations are logged to the server console instead of sent — fine for testing,
not for production.

## 8. Vercel deployment

1. Push this repo to GitHub
2. Import it in Vercel
3. Add every variable from .env.example (with real values) in Project Settings > Environment
   Variables — set them for Production (and Preview if you want staging)
4. Deploy
5. vercel.json already configures the stale-reservation cleanup cron (every 15 minutes) —
   Vercel Cron requires a paid plan for anything more frequent than daily; on the free (Hobby)
   plan, either upgrade or reduce the cron to run once daily, accepting that abandoned carts
   hold their stock reservation until then

## 9. Domain & HTTPS

Point your domain's DNS at Vercel (they'll give you the exact records after adding the domain
in Project Settings > Domains). HTTPS is automatic. Update `NEXT_PUBLIC_SITE_URL` to match.

## 10. Production testing checklist

Before telling customers the site is live:

- [ ] Place a real test order end-to-end with test:true Ziina payments
- [ ] Confirm the webhook actually fires and the order flips to CONFIRMED/PAID
- [ ] Confirm stock decrements correctly and doesn't oversell (try two near-simultaneous orders
      for the last unit of a low-stock test product)
- [ ] Confirm a failed payment does NOT mark the order paid
- [ ] Log into /admin/login, change an order status, confirm the audit log records it
- [ ] Confirm /admin/* is unreachable when logged out
- [ ] Run npm run build clean, with zero errors, in your real environment
- [ ] Swap PAYMENT_SECRET_KEY / PAYMENT_WEBHOOK_SECRET to Ziina's live (non-test) credentials
      only once everything above passes

## 11. Backups

Supabase/Neon both offer automatic daily backups on paid tiers — confirm your plan includes
this and know the restoration procedure before launch. Keep your .env values backed up
somewhere secure and separate from the database backup — losing AUTH_SECRET invalidates all
admin sessions, losing PAYMENT_SECRET_KEY requires regenerating it from Ziina.

## 12. Troubleshooting

- "Cannot find module '.prisma/client'" — run npx prisma generate
- Webhook returns 401 — your PAYMENT_WEBHOOK_SECRET doesn't match what you registered with
  Ziina, or something between Ziina and your endpoint modified the raw request body
- Orders stuck PENDING forever — check the webhook is actually reaching your deployment
  (Ziina's dashboard shows delivery attempts/failures); the cron job will eventually cancel
  and release stock for anything stuck over 45 minutes regardless

## Assumptions made / needs business confirmation

- Delivery fee: AED 30 flat for all of Dubai (placeholder)
- Free delivery threshold: AED 300 (matches the marquee text on the original site)
- Same-day cutoff: 3:00 PM (placeholder, not from the original site)
- Tax rate: 0% (no rate was ever specified — do not enable without legal/finance confirmation)
- Product size options (Standard/Premium/Luxury with +AED 100/+AED 250) were added as a
  reasonable default so checkout has something to validate against option groups — the
  business should review and correct every product's actual size/price variants, since the
  original site had no such options at all
- Legal pages (Privacy/Terms/Refund/Delivery policy) are linked in the footer but the pages
  themselves are not yet written — do not launch without real, reviewed legal content

## Credentials you need to create before going live

1. Supabase (or Neon) project
2. Ziina merchant account + API key + webhook secret
3. Resend (or other) transactional email account + verified sending domain
4. Vercel account + project
5. Your domain's DNS access
