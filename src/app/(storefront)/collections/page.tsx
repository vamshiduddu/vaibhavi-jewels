import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore Antique, American Diamond, and Victorian Diamond jewellery collections.",
};

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { status: "active" } } } } },
  });

  return (
    <>
      <section className="category-hero">
        <h1>Collections</h1>
        <p>Choose your finish — every collection is curated for celebrations and everyday shine.</p>
      </section>
      <section className="collections">
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
    </>
  );
}
