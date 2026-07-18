import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getActiveCategories, getActiveCollections, getHomepageNewArrivals } from "@/lib/catalog";
import { getSections, getSettings, whatsappLink } from "@/lib/content";
import { getActivePromotions } from "@/lib/pricing";

const MAPS_URL = "https://maps.app.goo.gl/Nq9amp46LcvgCfHN6";

export default async function HomePage() {
  const [sections, settings, promotions, collections, categories, products] = await Promise.all([
    getSections(),
    getSettings(),
    getActivePromotions(),
    getActiveCollections(),
    getActiveCategories(),
    getHomepageNewArrivals(),
  ]);

  const phone = settings.whatsapp_phone ?? "918074486906";

  return (
    <>
      <section className="catalog-hero" id="catalog">
        <div className="section-heading">
          <p className="section-kicker">Vaibhavi Jewels</p>
          <h1>Browse the live catalogue across every collection and category.</h1>
          <p>
            Fresh inventory, dynamic pricing, and direct add-to-cart ordering without a banner-led homepage.
          </p>
        </div>
        <div className="catalog-hero-actions">
          <Link className="primary-button" href="/categories">
            Explore Categories
          </Link>
          <Link className="secondary-button" href="/collections">
            Shop Collections
          </Link>
        </div>
      </section>

      {collections.length ? (
        <section className="collections collections-featured" aria-labelledby="collections-title">
          <div className="section-heading section-heading-center">
            <p className="section-kicker">Curated collections</p>
            <h2 id="collections-title">Hover the menu or jump straight into these edits.</h2>
          </div>
          <div className="collection-strip">
            {collections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.slug}`} className="collection-pill">
                {collection.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="collections" aria-labelledby="catalog-grid-title">
        <div className="section-heading">
          <p className="section-kicker">{sections.new_arrivals?.kicker ?? "Live inventory"}</p>
          <h2 id="catalog-grid-title">{sections.new_arrivals?.title ?? "Shop 25 products from across the catalogue."}</h2>
          <p>
            Products are served dynamically with cached catalogue queries and lazy-loaded images to keep the storefront responsive.
          </p>
        </div>
        <div className="product-grid product-grid-dense">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} promotions={promotions} />
          ))}
        </div>
      </section>

      {categories.length ? (
        <section className="categories" id="categories" aria-labelledby="category-title">
          <div className="section-heading section-heading-center">
            <p className="section-kicker">Shop by category</p>
            <h2 id="category-title">Navigate by product type, then drill into subcategories.</h2>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                {category.name}
                <span>{category.subcategories.length ? `${category.subcategories.length} subcategories` : "See more"}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="trust">
        <div>
          <strong>Dynamic D2C Selling</strong>
          <span>Online orders, social selling, and POS inventory can run against the same catalogue.</span>
        </div>
        <div>
          <strong>Secure Payments</strong>
          <span>Razorpay checkout for the storefront, manual sales capture for assisted channels.</span>
        </div>
        <div>
          <strong>Store Visit</strong>
          <span>Use the map link below for walk-ins, pickups, and in-store discovery.</span>
        </div>
      </section>

      <section className="visit" id="visit">
        <div>
          <p className="section-kicker">{sections.contact?.kicker ?? "Visit Vaibhavi Jewels"}</p>
          <h2>{sections.contact?.title ?? "Order online, over DM, or visit the store."}</h2>
          <p>{sections.contact?.body ?? "Pan India shipping with WhatsApp support and in-store assistance."}</p>
        </div>
        <div className="contact-box">
          <a href={whatsappLink(phone, "Hello Vaibhavi Jewels, I would like to order jewellery.")} target="_blank" rel="noreferrer">
            WhatsApp: {settings.whatsapp_display ?? "+91 80744 86906"}
          </a>
          <a href={MAPS_URL} target="_blank" rel="noreferrer">
            Store Location
          </a>
          {settings.instagram_url ? (
            <a href={settings.instagram_url} target="_blank" rel="noreferrer">
              {settings.instagram_handle ?? "Instagram"}
            </a>
          ) : null}
          {settings.youtube_url ? (
            <a href={settings.youtube_url} target="_blank" rel="noreferrer">
              YouTube
            </a>
          ) : null}
        </div>
      </section>
    </>
  );
}
