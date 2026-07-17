import Link from "next/link";
import { db } from "@/lib/db";
import { getSections, getSettings, whatsappLink } from "@/lib/content";
import { getActivePromotions } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const now = new Date();
  const [sections, settings, promotions, collections, categories, newArrivals, banners] =
    await Promise.all([
      getSections(),
      getSettings(),
      getActivePromotions(),
      db.collection.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.product.findMany({
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: { images: { where: { kind: "image" }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      }),
      db.banner.findMany({
        where: {
          active: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  const hero = sections.hero;
  const heroBanner = banners.find((b) => b.location === "homepage_hero");
  const offerBanners = banners.filter((b) => b.location === "offer_strip");
  const phone = settings.whatsapp_phone ?? "918074486906";

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-banner"
          src={heroBanner?.imageUrl ?? hero?.imageUrl ?? "/vaibhavi-banner.png"}
          alt={heroBanner?.title ?? "Vaibhavi Jewels banner"}
        />
        <div className="hero-content">
          <p className="eyebrow">{hero?.kicker ?? "Elegant Designs | Premium Quality | Pan India Shipping"}</p>
          <h1>{hero?.title ?? settings.site_name ?? "Vaibhavi Jewels"}</h1>
          <p className="hero-copy">
            {hero?.body ?? "Not just jewellery, a statement of grace. Curated for the modern woman."}
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/collections">
              View Collections
            </Link>
            <Link className="secondary-button" href="/categories">
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {offerBanners.length ? (
        <section className="collections collections-featured" aria-label="Special offers">
          <div className="collection-grid">
            {offerBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.linkUrl ?? "/collections"}
                className="collection-pill"
              >
                {banner.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {collections.length ? (
        <section className="collections collections-featured" aria-labelledby="collections-title">
          <div className="section-heading section-heading-center">
            <p className="section-kicker">Shop by collections</p>
            <h2 id="collections-title">Choose your finish.</h2>
          </div>
          <div className="collection-strip">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="collection-pill"
              >
                {collection.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sections.intro ? (
        <section className="intro">
          <div>
            <p className="section-kicker">{sections.intro.kicker ?? "Designed with care"}</p>
            <h2>{sections.intro.title ?? "Elegant one gram jewellery for every occasion."}</h2>
          </div>
          <p>{sections.intro.body}</p>
        </section>
      ) : null}

      {newArrivals.length ? (
        <section className="collections" id="new-arrivals" aria-labelledby="arrivals-title">
          <div className="section-heading">
            <p className="section-kicker">{sections.new_arrivals?.kicker ?? "New arrivals"}</p>
            <h2 id="arrivals-title">
              {sections.new_arrivals?.title ?? "Fresh styles ready to order."}
            </h2>
          </div>
          <div className="product-grid">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} promotions={promotions} />
            ))}
          </div>
        </section>
      ) : null}

      {sections.bridal ? (
        <section className="bridal" id="bridal">
          <div className="bridal-panel">
            <p className="section-kicker">{sections.bridal.kicker ?? "Occasion styling"}</p>
            <h2>{sections.bridal.title ?? "Curated jewellery for the modern woman."}</h2>
            <p>{sections.bridal.body}</p>
            <a
              className="primary-button"
              href={
                sections.bridal.ctaUrl ??
                whatsappLink(phone, "Hello Vaibhavi Jewels, I would like to order jewellery.")
              }
              target="_blank"
              rel="noreferrer"
            >
              {sections.bridal.ctaText ?? "DM to Order"}
            </a>
          </div>
        </section>
      ) : null}

      {categories.length ? (
        <section className="categories" id="categories" aria-labelledby="category-title">
          <div className="section-heading section-heading-center">
            <p className="section-kicker">Shop by category</p>
            <h2 id="category-title">Browse by jewellery type.</h2>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                {category.name} <span>See more</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sections.payments ? (
        <section className="payments" id="payments" aria-labelledby="payments-title">
          <div className="section-heading section-heading-center">
            <p className="section-kicker">{sections.payments.kicker ?? "Secure checkout"}</p>
            <h2 id="payments-title">
              {sections.payments.title ?? "Pay securely online with Razorpay."}
            </h2>
            <p>{sections.payments.body}</p>
          </div>
        </section>
      ) : null}

      <section className="trust">
        <div>
          <strong>Elegant Designs</strong>
          <span>Timeless beauty for special occasions and daily styling.</span>
        </div>
        <div>
          <strong>Premium Quality</strong>
          <span>One gram jewellery with a polished, occasion-ready finish.</span>
        </div>
        <div>
          <strong>Pan India Shipping</strong>
          <span>Safe and secure delivery to your doorstep.</span>
        </div>
      </section>

      <section className="visit" id="visit">
        <div>
          <p className="section-kicker">{sections.contact?.kicker ?? "Visit Vaibhavi Jewels"}</p>
          <h2>{sections.contact?.title ?? "Order online or DM us."}</h2>
          <p>{sections.contact?.body ?? "Pan India shipping with WhatsApp support."}</p>
        </div>
        <div className="contact-box">
          <a
            href={whatsappLink(phone, "Hello Vaibhavi Jewels, I would like to order jewellery.")}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp: {settings.whatsapp_display ?? "+91 80744 86906"}
          </a>
          {settings.instagram_url ? (
            <a href={settings.instagram_url} target="_blank" rel="noreferrer">
              {settings.instagram_handle ?? "Instagram"}
            </a>
          ) : null}
          {settings.facebook_url ? (
            <a href={settings.facebook_url} target="_blank" rel="noreferrer">
              Facebook
            </a>
          ) : null}
          {settings.youtube_url ? (
            <a href={settings.youtube_url} target="_blank" rel="noreferrer">
              YouTube
            </a>
          ) : null}
          <span>Pan India shipping available</span>
        </div>
      </section>
    </>
  );
}
