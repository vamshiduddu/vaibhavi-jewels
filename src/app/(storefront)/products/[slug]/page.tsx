import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { effectivePrice, getActivePromotions } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { getWishlistSessionId } from "@/lib/wishlist-actions";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ProductCard from "@/components/ProductCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { images: { take: 1, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] } },
  });
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] },
      category: true,
      subcategory: true,
      collection: true,
      attributes: true,
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!product || product.status !== "active") notFound();

  const promotions = await getActivePromotions();
  const { price, compareAt, label } = effectivePrice(product, promotions);

  const sessionId = await getWishlistSessionId();
  const saved = sessionId
    ? !!(await db.wishlistItem.findUnique({
        where: { sessionId_productId: { sessionId, productId: product.id } },
      }))
    : false;

  const related = product.categoryId
    ? await db.product.findMany({
        where: { categoryId: product.categoryId, status: "active", id: { not: product.id } },
        take: 3,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      })
    : [];

  const mainImage = product.images[0];
  const outOfStock = product.stockQuantity < 1;
  const lowStock = !outOfStock && product.stockQuantity <= product.lowStockThreshold;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.sku ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="product-detail">
        <div className="product-gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="product-gallery-main"
            src={mainImage?.url ?? "/vaibhavi-logo.png"}
            alt={mainImage?.alt ?? product.title}
          />
          {product.images.length > 1 ? (
            <div className="product-gallery-thumbs">
              {product.images.slice(1, 6).map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={image.id} src={image.url} alt={image.alt ?? product.title} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="product-info">
          <p className="product-tag">
            {[product.collection?.name, product.category?.name, product.subcategory?.name]
              .filter(Boolean)
              .join(" · ") || "Vaibhavi Jewels"}
            {label ? ` · ${label}` : ""}
          </p>
          <h1>{product.title}</h1>
          <div className="price-row">
            <span className="price-now">{formatINR(price)}</span>
            {compareAt ? <span className="price-was">{formatINR(compareAt)}</span> : null}
            {compareAt ? (
              <span className="price-off">
                {Math.round(((compareAt - price) / compareAt) * 100)}% off
              </span>
            ) : null}
          </div>
          {lowStock ? (
            <p className="stock-note low">Only {product.stockQuantity} left in stock.</p>
          ) : null}
          {outOfStock ? <p className="stock-note out">Currently out of stock.</p> : null}
          <div className="product-actions">
            <AddToCartButton productId={product.id} disabled={outOfStock} />
            <WishlistButton productId={product.id} initiallySaved={saved} />
          </div>
          {product.description || product.shortDescription ? (
            <p className="product-desc">{product.description ?? product.shortDescription}</p>
          ) : null}
          <div className="product-meta">
            {product.sku ? <span>SKU: {product.sku}</span> : null}
            {product.material ? <span>Material: {product.material}</span> : null}
            {product.color ? <span>Colour: {product.color}</span> : null}
            {product.occasion ? <span>Occasion: {product.occasion}</span> : null}
            {product.attributes.map((attr) => (
              <span key={attr.id}>
                {attr.name}: {attr.value}
              </span>
            ))}
            <span>Pan India shipping · Secure Razorpay checkout</span>
          </div>
          {product.category ? (
            <p style={{ marginTop: 20 }}>
              <Link href={`/categories/${product.category.slug}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                More in {product.category.name} →
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      {product.reviews.length ? (
        <section className="page-section" style={{ paddingTop: 0 }}>
          <div className="section-heading">
            <p className="section-kicker">Reviews</p>
            <h2>What customers say</h2>
          </div>
          <div className="collection-grid">
            {product.reviews.map((review) => (
              <article key={review.id} className="admin-card">
                <strong>
                  {review.authorName} · {"★".repeat(review.rating)}
                </strong>
                <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{review.body}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="collections" aria-label="Related products">
          <div className="section-heading">
            <p className="section-kicker">You may also like</p>
            <h2>More from this category</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} promotions={promotions} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
