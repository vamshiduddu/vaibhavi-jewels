import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getActivePromotions } from "@/lib/pricing";
import ProductCard from "@/components/ProductCard";
import EmptyCatalogNote from "@/components/EmptyCatalogNote";

type Props = { params: Promise<{ categorySlug: string; subcategorySlug: string }> };

async function findSubcategory(categorySlug: string, subcategorySlug: string) {
  const category = await db.category.findUnique({ where: { slug: categorySlug } });
  if (!category || !category.active) return null;
  const subcategory = await db.subcategory.findUnique({
    where: { categoryId_slug: { categoryId: category.id, slug: subcategorySlug } },
    include: {
      category: { include: { subcategories: { where: { active: true }, orderBy: { sortOrder: "asc" } } } },
      products: {
        where: { status: "active" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        include: { images: { orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } },
      },
    },
  });
  return subcategory?.active ? subcategory : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const subcategory = await findSubcategory(categorySlug, subcategorySlug);
  if (!subcategory) return {};
  return {
    title: subcategory.seoTitle ?? `${subcategory.name} ${subcategory.category.name}`,
    description:
      subcategory.seoDescription ??
      subcategory.description ??
      `Shop ${subcategory.name} in ${subcategory.category.name} at Vaibhavi Jewels.`,
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { categorySlug, subcategorySlug } = await params;
  const subcategory = await findSubcategory(categorySlug, subcategorySlug);
  if (!subcategory) notFound();

  const promotions = await getActivePromotions();

  return (
    <>
      <section className="category-hero">
        <h1>{subcategory.name}</h1>
        <p>
          {subcategory.description ??
            `${subcategory.name} styles from our ${subcategory.category.name} range.`}
        </p>
        <div className="subcategory-strip">
          <Link href={`/categories/${subcategory.category.slug}`}>All {subcategory.category.name}</Link>
          {subcategory.category.subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/categories/${subcategory.category.slug}/${sub.slug}`}
              className={sub.id === subcategory.id ? "active" : undefined}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="products products-page">
        {subcategory.products.length ? (
          <div className="product-grid">
            {subcategory.products.map((product) => (
              <ProductCard key={product.id} product={product} promotions={promotions} />
            ))}
          </div>
        ) : (
          <EmptyCatalogNote label={subcategory.name} />
        )}
      </section>
    </>
  );
}
