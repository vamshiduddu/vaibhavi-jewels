import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { effectivePrice, getActivePromotions } from "@/lib/pricing";
import { formatINR } from "@/lib/format";
import { getWishlistSessionId } from "@/lib/wishlist-actions";
import { getProductPageData } from "@/lib/product-read";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductPageData(slug);
  if (!product) return {};
  const image = product.images.find((item) => item.kind === "image");
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: image ? { images: [image.url] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductPageData(slug);
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
        include: { images: { where: { kind: "image" }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      })
    : [];

  const galleryMedia = product.images.map((m) => ({
    url: m.url,
    kind: (m.kind === "video" ? "video" : "image") as "image" | "video",
    alt: m.alt,
  }));
  const imageOnly = product.images.filter((m) => m.kind !== "video");
  const outOfStock = product.stockQuantity < 1;
  const lowStock = !outOfStock && product.stockQuantity <= product.lowStockThreshold;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription ?? undefined,
    image: imageOnly.map((i) => i.url),
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
        <ProductGallery media={galleryMedia} title={product.title} />
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
