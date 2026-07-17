# Vaibhavi Jewels

Full-stack ecommerce storefront for vaibhavijewels.in, built with Next.js (App Router), TypeScript, Prisma, and Supabase Postgres. Razorpay powers online checkout. The previous static site is archived in `legacy/`.

## Stack

- **Framework:** Next.js App Router + TypeScript
- **Database:** Supabase Postgres via Prisma
- **Auth:** Custom JWT admin sessions (jose + bcryptjs), role-based (`super_admin`, `catalog_manager`, `order_manager`, `support`)
- **Payments:** Razorpay (checkout + webhook)
- **Hosting target:** Vercel

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — Supabase Postgres (pooled + direct)
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — first admin login
   - Razorpay keys + webhook secret
2. Install and initialise:

```bash
npm install
npm run db:push     # create tables in Supabase
npm run db:seed     # seed categories, collections, content, admin user
npm run dev
```

Storefront: `http://localhost:3000` · Admin: `http://localhost:3000/admin`

## Structure

- `src/app/(storefront)` — home, collections, categories/subcategories, products, search, cart, checkout, orders, wishlist, account
- `src/app/admin` — admin panel (products, categories, subcategories, collections, promotions, coupons, orders, customers, inventory, content, settings)
- `src/app/api` — Razorpay verify + webhook endpoints
- `src/lib` — db client, auth, pricing/promotions engine, cart, checkout, admin actions
- `prisma/` — schema + seed
- `legacy/` — archived static site (reference for brand/design)

## Razorpay webhook

Point a webhook at `/api/webhooks/razorpay` with events `payment.captured` and `payment.failed`, using `RAZORPAY_WEBHOOK_SECRET`.

## Promotions engine

Product prices automatically reflect the best active discount among: product sale-price windows, product/subcategory/category/collection promotions, and sitewide campaigns. Coupons apply on top at cart/checkout. All managed from `/admin/promotions` and `/admin/coupons`.
