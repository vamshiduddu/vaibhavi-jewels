import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getActivePromotions } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = { title: "Search" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const products = query
    ? await db.product.findMany({
        where: {
          status: "active",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { shortDescription: { contains: query, mode: "insensitive" } },
            { tags: { has: query.toLowerCase() } },
            { category: { name: { contains: query, mode: "insensitive" } } },
            { collection: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: 24,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      })
    : [];

  const promotions = products.length ? await getActivePromotions() : [];

  return (
    <>
      <section className="category-hero">
        <h1>{query ? `Results for “${query}”` : "Search"}</h1>
        <p>
          {query
            ? `${products.length} piece${products.length === 1 ? "" : "s"} found.`
            : "Use the search bar above to find earrings, necklaces, antique pieces, and more."}
        </p>
      </section>
      <section className="products products-page">
        {query && !products.length ? (
          <div className="empty-collection">
            <strong>No matches for “{query}”.</strong>
            <span>Try a different word, or browse the categories instead.</span>
          </div>
        ) : null}
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} promotions={promotions} />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
