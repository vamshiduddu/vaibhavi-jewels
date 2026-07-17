import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getActivePromotions } from "@/lib/pricing";
import { getWishlistSessionId } from "@/lib/wishlist-actions";
import ProductCard from "@/components/ProductCard";
import EmptyCatalogNote from "@/components/EmptyCatalogNote";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const sessionId = await getWishlistSessionId();
  const items = sessionId
    ? await db.wishlistItem.findMany({
        where: { sessionId, product: { status: "active" } },
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: { images: { where: { kind: "image" }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
          },
        },
      })
    : [];

  const promotions = await getActivePromotions();

  return (
    <>
      <section className="category-hero">
        <h1>Wishlist</h1>
        <p>Pieces you have saved for later.</p>
      </section>
      <section className="products products-page">
        {items.length ? (
          <div className="product-grid">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.product} promotions={promotions} />
            ))}
          </div>
        ) : (
          <EmptyCatalogNote label="Wishlist" />
        )}
      </section>
    </>
  );
}
