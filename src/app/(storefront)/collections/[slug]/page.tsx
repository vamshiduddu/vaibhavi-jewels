import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getActivePromotions } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import EmptyCatalogNote from "@/components/EmptyCatalogNote";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await db.collection.findUnique({ where: { slug } });
  if (!collection) return {};
  return {
    title: collection.seoTitle ?? `${collection.name} Collection`,
    description:
      collection.seoDescription ??
      collection.description ??
      `Shop the ${collection.name} collection at Vaibhavi Jewels.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await db.collection.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      },
    },
  });
  if (!collection || !collection.active) notFound();

  const promotions = await getActivePromotions();

  return (
    <>
      <section className="category-hero">
        <h1>{collection.name}</h1>
        <p>{collection.description ?? `Explore our ${collection.name} finish jewellery.`}</p>
      </section>
      <section className="products products-page">
        {collection.products.length ? (
          <div className="product-grid">
            {collection.products.map((product) => (
              <ProductCard key={product.id} product={product} promotions={promotions} />
            ))}
          </div>
        ) : (
          <EmptyCatalogNote label={collection.name} />
        )}
      </section>
    </>
  );
}
