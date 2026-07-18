import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getProductPageData = cache(async (slug: string) => {
  return db.product.findUnique({
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
});
