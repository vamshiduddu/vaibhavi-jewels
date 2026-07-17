# Vaibhavi Jewels Hard Launch Plan

## Direction

This repository already defines the brand language we need to preserve:

- Color palette from `styles.css`
- Existing logo assets
- Existing banner asset
- Existing typography choices
- Existing luxury/traditional visual tone
- Existing category structure

The rebuild should **not** redesign the brand. It should convert the current static storefront into a full dynamic `Next.js` ecommerce application while keeping the same visual identity.

This is a **single hard-launch plan**, not a phased MVP plan. The target is one production-ready release with admin, payments, catalog management, and dynamic routing in place from day one.

## Existing Brand System To Preserve

The current repo should be treated as the reference for design tokens and brand assets.

### Colors

From `styles.css`, preserve and port these tokens into the Next.js app:

- `--ink: #211816`
- `--muted: #6b625d`
- `--paper: #fffaf3`
- `--cream: #f6eadc`
- `--rose: #74131e`
- `--maroon: #650815`
- `--gold: #b47a1d`

These should become the canonical theme variables in the new app.

### Typography

Preserve the current type system:

- `Cormorant Garamond` for headings and luxury brand accents
- `Inter` for body copy and interface text

### Assets

Preserve and reuse:

- `vaibhavi-logo.png`
- `vaibhavi-banner.png`
- Existing product images as seed data where applicable

Product images will be uploaded dynamically later through admin, but the system should support that from the start.

### UI Language

Preserve the current visual direction:

- warm ivory background tones
- maroon and gold accents
- premium jewellery presentation
- card-based product layouts
- strong WhatsApp/contact emphasis where needed

## Hard Launch Goal

Launch a fully dynamic commerce platform in one release with:

- dynamic homepage sections
- dynamic collections
- dynamic categories
- dynamic subcategories
- dynamic product routes
- admin panel
- inventory
- cart
- checkout
- payment gateway
- order management
- coupon support
- content management for banners and homepage sections

## Platform Decision

Rebuild the site as a full-stack `Next.js` application using the App Router and TypeScript.

Recommended stack:

- Framework: `Next.js` App Router
- Language: `TypeScript`
- Database: `Supabase Postgres`
- ORM: `Prisma`
- Auth: `NextAuth` or equivalent role-based auth
- Storage: `Cloudinary` or `S3`
- Payments: `Razorpay` first
- Hosting: `Vercel`
- Email: transactional email provider
- Admin/file upload handling: inside the same Next.js app

Supabase should be treated as the primary database platform for this build. That means:

- `Supabase Postgres` as the production database
- Prisma connected to Supabase Postgres
- optional use of Supabase services where helpful
- database environments planned around Supabase from the start

## Required Dynamic Data Model

Everything important should be managed from the database and admin panel. No hardcoded catalog content should remain.

Core entities:

- AdminUser
- Role
- Permission
- Customer
- Address
- Category
- Subcategory
- Collection
- Product
- ProductVariant
- ProductImage
- ProductAttribute
- InventoryRecord
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Coupon
- Promotion
- PromotionRule
- DiscountCampaign
- SpecialOffer
- Banner
- HomepageSection
- SiteSetting
- Review

## Required Dynamic Route Strategy

The storefront should be built around dynamic routing from the start.

Suggested route map:

- `/`
- `/collections`
- `/collections/[slug]`
- `/categories`
- `/categories/[categorySlug]`
- `/categories/[categorySlug]/[subcategorySlug]`
- `/products/[slug]`
- `/search`
- `/cart`
- `/checkout`
- `/order/[orderId]`
- `/account`
- `/account/orders`
- `/wishlist`
- `/admin`

 admin route grouping:

- `/admin/dashboard`
- `/admin/products`
- `/admin/categories`
- `/admin/subcategories`
- `/admin/collections`
- `/admin/orders`
- `/admin/customers`
- `/admin/coupons`
- `/admin/content`
- `/admin/settings`

## Initial Dynamic Seed Content

The current repo already implies the initial taxonomy. That taxonomy should be seeded into the database so the new app launches with the same navigational structure.

Initial top-level categories inferred from the current site:

- Earrings
- Necklace
- Long Haram
- Bangles
- Choker
- Mala
- Hipbelt
- Vangi
- Nose Pin
- Finger Ring
- Maang Tikka
- Hair Accessories

Initial collections inferred from the current site:

- Antique
- American Diamond
- Victorian Diamond

Subcategories should also be dynamic from the database. They should not be hardcoded in routes or page files.

Examples of how this should work:

- a category is created in admin
- its slug is generated and stored
- optional subcategories are added under it
- products are linked to category and subcategory
- frontend pages render automatically from that data

## Homepage Requirements

The homepage should remain visually close to the current site, but all content blocks should be dynamic.

Sections that should become admin-managed:

- announcement bar
- hero banner
- special offers banner
- featured collections
- intro copy
- new arrivals
- bridal or occasion section
- promotional campaign strips
- sitewide sale sections
- limited-time offer blocks
- category grid
- payment information
- trust section
- contact section
- footer links and text

This allows future edits without code changes.

## Catalog Requirements

Products must be fully dynamic and admin-managed.

Each product should support:

- title
- slug
- short description
- full description
- price
- compare-at price
- SKU
- stock quantity
- category
- subcategory
- collection
- tags
- multiple images
- featured image
- status
- SEO title
- SEO description

Optional but useful:

- color metadata
- material metadata
- occasion tags
- related products
- featured flags
- promotional badges
- limited-time pricing windows
- campaign priority ordering

## Admin Panel Requirements

The admin panel is mandatory for launch. It should not be deferred.

Required modules:

- dashboard
- products
- categories
- subcategories
- collections
- promotions
- special offers
- banners
- homepage sections
- inventory
- orders
- customers
- coupons
- settings

Required admin actions:

- create/edit/archive products
- upload product images
- reorder product images
- create/edit categories
- create/edit subcategories
- create/edit collections
- assign products to category/subcategory/collection
- create sitewide discount campaigns
- create category-level discount campaigns
- create collection-level discount campaigns
- create product-level special offers
- schedule promotional start and end dates
- configure promotional banners and badges
- manage homepage content
- manage stock
- update order status
- view payment state
- manage coupon rules

Required roles:

- `super_admin`
- `catalog_manager`
- `order_manager`
- `support`

## Commerce Requirements

This launch should include real ecommerce behavior, not just lead capture.

Required user features:

- browse catalog
- view collections
- view category pages
- view subcategory pages
- product detail pages
- add to cart
- update cart
- checkout
- address entry
- order confirmation

Checkout should support:

- guest checkout
- shipping charge calculation
- coupon application
- automatic promotional discount application
- sitewide discount application rules
- payment status handling
- order creation before payment confirmation

## Payment Requirements

Primary gateway: `Razorpay`

Reasons:

- India-first business fit
- strong support for web checkout
- standard integration model
- webhook support

Implementation requirements:

- create Razorpay order on the server
- launch checkout on the client
- verify signature on the server
- persist payment record
- update order status idempotently
- handle webhook events safely

Payment states to model:

- initiated
- authorized
- paid
- failed
- refunded

## Promotions And Special Features

This launch should include a real promotions engine, not just basic coupon support.

Required capabilities:

- special offers section on the homepage
- sitewide discount campaigns
- category-level discounts
- subcategory-level discounts
- collection-level discounts
- product-level sale pricing
- coupon codes
- fixed amount discounts
- percentage discounts
- scheduled promotions with start and end dates
- promotional badges such as `Sale`, `Limited Offer`, `Best Seller`, `New Arrival`
- announcement bar campaigns
- hero banner campaigns
- auto-apply discounts at checkout when eligible

Promotion rule examples the system should support:

- 10% off sitewide
- 15% off Antique collection
- Rs. 200 off orders above a threshold
- selected products on special offer
- festive launch sale across multiple categories
- limited-time homepage campaign

Promotions should be manageable from admin and should not require code deployment.

## Order Operations

Orders must be manageable in admin from day one.

Required order statuses:

- pending
- payment_pending
- paid
- processing
- packed
- shipped
- delivered
- cancelled
- refunded

Required order features:

- order detail page
- customer details
- payment details
- shipping details
- line items
- internal notes
- status updates

## Inventory Requirements

Inventory should be dynamic and tracked in the database.

Required features:

- stock quantity per product or variant
- low stock indication
- out-of-stock handling
- stock deduction after successful payment
- manual admin stock adjustment

## Content Management Requirements

The new system must allow non-developer content updates.

Admin-managed content should include:

- site announcement text
- hero images
- homepage banners
- offer banners
- sale campaign banners
- featured sections
- footer text
- contact links
- social links
- payment/help copy

## SEO And Discovery Requirements

Must be included in the hard launch:

- dynamic metadata
- sitemap generation
- robots configuration
- canonical URLs
- product metadata
- category metadata
- collection metadata
- promotional landing page metadata
- structured data where useful

## Non-Negotiable Build Rules

- Keep the current brand palette
- Keep the current typography
- Reuse current logos and banners
- Make catalog fully dynamic
- Make categories dynamic
- Make subcategories dynamic
- Make collections dynamic
- Make promotions dynamic
- Make special offers dynamic
- Support sitewide discount campaigns
- Make homepage sections dynamic
- Do not rely on hardcoded category pages
- Do not keep static HTML storefront structure as the final product

## Build Order

Even though this is a single hard launch, the engineering work still has to happen in a concrete order. The difference is that all of these are part of one planned release.

1. Scaffold the `Next.js` app and move the current design system into it.
2. Define the database schema for catalog, admin, orders, payments, and content.
3. Build admin authentication and role management.
4. Build admin CRUD for categories, subcategories, collections, and products.
5. Seed the existing catalog structure and brand content from the current repo.
6. Build all dynamic storefront routes.
7. Build cart and checkout.
8. Integrate Razorpay and webhook processing.
9. Build order and inventory operations in admin.
10. Add SEO, content management, and launch hardening.

## Immediate Next Steps

The repo plan should now assume:

- no phased MVP
- one dynamic production build
- current repo visuals are the design source
- all catalog structure is database-driven
- all important storefront sections are admin-driven

## Recommended Execution For This Repo

The next implementation work should be:

1. Convert this repo from static HTML to a `Next.js` codebase.
2. Extract the existing `styles.css` tokens and visual system into the new app.
3. Seed current categories, collections, banner, logo, site content, and initial promotional structures into database records.
4. Build database-first dynamic routes for categories, subcategories, collections, products, and promotional sections.
5. Build admin so future uploads, offers, discounts, and content changes happen without editing code.
6. Integrate Razorpay and complete the full checkout, discount, and order flow before launch.
