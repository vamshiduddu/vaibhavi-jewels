import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vaibhavijewels.in";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/collections",
    "/categories",
    "/search",
  ].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 }));

  try {
    const [categories, subcategories, collections, products] = await Promise.all([
      db.category.findMany({ where: { active: true } }),
      db.subcategory.findMany({ where: { active: true }, include: { category: true } }),
      db.collection.findMany({ where: { active: true } }),
      db.product.findMany({ where: { status: "active" } }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((c) => ({
        url: `${base}/categories/${c.slug}`,
        lastModified: c.updatedAt,
        priority: 0.8,
      })),
      ...subcategories.map((s) => ({
        url: `${base}/categories/${s.category.slug}/${s.slug}`,
        lastModified: s.updatedAt,
        priority: 0.7,
      })),
      ...collections.map((c) => ({
        url: `${base}/collections/${c.slug}`,
        lastModified: c.updatedAt,
        priority: 0.8,
      })),
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        priority: 0.9,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
