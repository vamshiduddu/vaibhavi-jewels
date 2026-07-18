import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse jewellery by type — earrings, necklaces, bangles, chokers, and more.",
};

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <section className="category-hero">
        <h1>Categories</h1>
        <p>Browse by jewellery type and find the piece made for your occasion.</p>
      </section>
      <section className="categories">
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              {category.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="category-card-media"
                    src={category.image}
                    alt={category.name}
                  />
                  <strong className="category-card-label">{category.name}</strong>
                </>
              ) : (
                <strong className="category-card-label">{category.name}</strong>
              )}
              <span>See more</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
