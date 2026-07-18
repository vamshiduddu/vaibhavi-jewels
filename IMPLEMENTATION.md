# Vaibhavi Jewels — Implementation Summary

Everything built on top of the original static site, per `SCALE_UP_PLAN.md`. The old static HTML site is archived in `legacy/`.

## 1. Platform Conversion

- Static HTML site → **Next.js 15 (App Router) + TypeScript**, hand-scaffolded at repo root.
- **Prisma + Supabase Postgres** as the database (project ref `htctcziuycdrkdvdnltm`, region `ap-northeast-1`).
  - Important: the direct DB host (`db.<ref>.supabase.co`) is IPv6-only. The app uses the IPv4 **pooler**: `aws-0-ap-northeast-1.pooler.supabase.com` — port 6543 (pgbouncer) for `DATABASE_URL`, port 5432 for `DIRECT_URL`.
- Brand system preserved exactly: palette tokens from old `styles.css` (`--ink, --muted, --paper, --cream, --rose, --maroon, --gold`), Cormorant Garamond + Inter via `next/font`, logo/banner assets in `public/`.
- Deploy target: Vercel. `npm run build` passes.

## 2. Database Schema (`prisma/schema.prisma`)

All entities from the plan:

- **Admin/auth:** `AdminUser` with roles `super_admin`, `catalog_manager`, `order_manager`, `support`
- **Catalog:** `Category`, `Subcategory`, `Collection`, `Product` (price, compare-at, SKU, stock, tags, badges, sale-price windows, SEO fields, color/material/occasion), `ProductImage` (with `kind`: image | video), `ProductVariant`, `ProductAttribute`, `StockAdjustment` (audit log)
- **Commerce:** `Cart`, `CartItem`, `Order` (9 statuses: pending → payment_pending → paid → processing → packed → shipped → delivered / cancelled / refunded), `OrderItem` (price snapshots), `Payment` (initiated/authorized/paid/failed/refunded)
- **Marketing:** `Promotion` (5 scopes), `Coupon`, `Banner`, `HomepageSection`, `SiteSetting`
- **Customers:** `Customer`, `Address`, `Review`, `WishlistItem`

Seed script (`prisma/seed.ts`): 12 categories, 3 collections (Antique, American Diamond, Victorian Diamond), 7 homepage sections, 11 site settings, sample product, `WELCOME10` coupon, super-admin user from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.

## 3. Storefront (all dynamic, DB-driven)

Routes: `/`, `/collections`, `/collections/[slug]`, `/categories`, `/categories/[categorySlug]`, `/categories/[categorySlug]/[subcategorySlug]`, `/products/[slug]`, `/search`, `/cart`, `/checkout`, `/order/[orderId]`, `/account`, `/account/orders`, `/wishlist`.

- Homepage sections (announcement, hero, intro, new arrivals, bridal, categories grid, payments, trust, contact, footer) all admin-editable.
- Product page: media gallery (below), price with promotion/sale display, stock notes, attributes, reviews, related products, JSON-LD structured data.
- Guest order tracking by phone number (no customer passwords).
- Wishlist via anonymous session cookie.

## 4. Premium Redesign

- **Flipkart-style header:** logo · centered search bar · Account / Wishlist / Cart icons (SVG) with live cart count badge; slim uppercase nav strip below; responsive (search drops to second row on mobile).
- Type scale tamed for a premium look (page titles ~26–38px serif, small-caps gold kickers with wide letter-spacing).
- Compact product cards: square images, ~5-across auto-fill grid, single-line titles, tight price rows, hover lift.
- **Customer dashboard** at `/account`: My Orders, Wishlist (live count), My Cart (live count), WhatsApp Support cards.

## 5. Cart, Checkout, Promotions Engine

- Cookie-based cart with server actions (add/update/remove, quantity clamped to stock).
- **Promotions engine** (`src/lib/pricing.ts`): sitewide / category / subcategory / collection / product scopes, percentage or fixed, scheduled windows, priority; best price wins; auto-applies to every displayed price and at checkout. Product-level sale-price windows also supported.
- **Coupons**: min order, max discount, usage limits, validity windows; stack on top of promotions.
- Shipping: flat rate + free-above threshold (both admin-set settings).
- Guest checkout with address capture; customer records deduped by phone/email.

## 6. Payments — Razorpay + Manual Mode

- **Razorpay**: server-side order creation, checkout.js client flow, HMAC signature verification (`/api/payments/verify`), idempotent webhook (`/api/webhooks/razorpay` — payment.captured / payment.failed), stock deducted exactly once on first paid transition, coupon usage counted once.
- **Manual-order mode (flag)**: when Razorpay keys are missing OR admin toggles *Settings → Online Payments → Disabled*, checkout skips payment: order lands as `pending`, stock reserved immediately, cart cleared, confirmation page shows "Pay via WhatsApp" link prefilled with the order number. Current state: keys empty → manual mode active.

## 7. Admin Panel (`/admin`)

- **Auth:** credentials login, JWT session cookie (jose HS256, `AUTH_SECRET`), middleware guard on all `/admin` routes, role-based permissions per action.
- **Modules:** Products (full form + media manager), Categories, Subcategories, Collections, Promotions, Coupons, Orders (status pipeline, payment records, internal notes, address/customer view), Customers (lifetime value), Inventory (manual stock adjustments with audit log + reasons), Content (banners + all homepage sections), Settings (site identity, socials, WhatsApp, shipping rates, payments toggle).

## 8. Analytics Dashboard (`/admin`)

- KPI tiles: Revenue (30d) with % delta vs previous 30d + sparkline, Orders + delta + sparkline, Avg Order Value, To-Fulfil count.
- Charts (hand-rolled SVG, zero chart-library weight, hover tooltips):
  - Revenue Trend — 30-day area chart with crosshair
  - Orders Per Day — bar chart with hover highlight
  - Order Status — horizontal bars, semantic colors
  - Revenue by Category — ranked horizontal bars
- Top Products, Low Stock, Recent Orders tables.
- Chart palette validated for colorblind safety + contrast: `#9c2434`, `#b47a1d`, `#0e8f7e`, `#5865c0`.

## 9. Product Media (gallery, uploads, video)

- **Storefront gallery** (`ProductGallery`): carousel with arrows + thumbnails, **zoom button** → fullscreen lightbox (click to zoom 2×, pan by scroll, Esc/arrow keys), video slides play inline in the carousel.
- **Video embeds**: YouTube (incl. Shorts/youtu.be), Instagram (reel/p/tv), Facebook — URL pasted in admin, provider auto-detected, embedded via iframe; YouTube thumbs auto-fetched, others get a play tile.
- **Admin media manager** (product form): drag-free reorder (←/→), remove, first image = cover; upload images **directly to Supabase Storage** (bucket `product-media`, via `/api/admin/upload`, admin-only, 8 MB limit) or paste image URLs; paste video links.
- All storefront cover-image queries filter `kind = "image"` so a video is never the card thumbnail.

## 10. Vercel Analytics

- `@vercel/analytics` (`<Analytics />`) + `@vercel/speed-insights` (`<SpeedInsights />`) in root layout. Enable both tabs in the Vercel project after deploy.

## 11. SEO

- Dynamic metadata on every route (products/categories/collections use their SEO fields), `sitemap.xml` (all live slugs), `robots.txt` (blocks /admin, /api, /cart, /checkout, /account, /order), Product JSON-LD, OpenGraph images.

---

## Environment (`.env`)

| Key | Status |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | ✅ set (Supabase pooler) |
| `AUTH_SECRET` | ⚠️ dev value — rotate for production |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | ⚠️ `admin@vaibhavijewels.in` / weak dev password — rotate |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | ✅ set |
| `SUPABASE_STORAGE_BUCKET` | `product-media` |
| `RAZORPAY_*` | ❌ empty → manual-order mode active |
| `NEXT_PUBLIC_SITE_URL` | localhost — set to https://vaibhavijewels.in in prod |

## Known Issues / Remaining Work

1. **Storage bucket is not public yet** — upload API works (returns a URL), but the public URL 404s ("Bucket not found"). Fix: Supabase dashboard → Storage → `product-media` → make bucket **Public** (the auto-create call didn't apply the public flag).
2. Razorpay keys pending — add keys + webhook (`/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`) to enable online payment.
3. Nothing committed to git yet.
4. Not deployed to Vercel yet; enable Web Analytics + Speed Insights after first deploy.
5. Rotate `AUTH_SECRET` + admin password before launch.

## Commands

```bash
npm run dev        # local dev
npm run build      # production build
npm run db:push    # sync schema to Supabase
npm run db:seed    # seed catalog/content/admin
```

Admin: `/admin` · Login: seed credentials from `.env`.
