import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getActivePromotions } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import EmptyCatalogNote from "@/components/EmptyCatalogNote";

type Props = { params: Promise<{ categorySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await db.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return {};
  return {
    title: category.seoTitle ?? category.name,
    description:
      category.seoDescription ??
      category.description ??
      `Shop ${category.name} at Vaibhavi Jewels — elegant one gram jewellery with pan India shipping.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    include: {
      subcategories: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      products: {
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      },
    },
  });
  if (!category || !category.active) notFound();

  const promotions = await getActivePromotions();

  return (
    <>
      <section className="category-hero">
        <h1>{category.name}</h1>
        <p>{category.description ?? `Explore our ${category.name} designs.`}</p>
        {category.subcategories.length ? (
          <div className="subcategory-strip">
            {category.subcategories.map((sub) => (
              <Link key={sub.id} href={`/categories/${category.slug}/${sub.slug}`}>
                {sub.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
      <section className="products products-page">
        {category.products.length ? (
          <div className="product-grid">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} promotions={promotions} />
            ))}
          </div>
        ) : (
          <EmptyCatalogNote label={category.name} />
        )}
      </section>
    </>
  );
}
