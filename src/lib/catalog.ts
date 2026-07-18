import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";

const getActiveCollectionsCached = unstable_cache(
  async () => {
    return db.collection.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  },
  ["catalog:collections:active"],
  { revalidate: 300, tags: [CACHE_TAGS.catalog] },
);

const getActiveCategoriesCached = unstable_cache(
  async () => {
    return db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        subcategories: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  },
  ["catalog:categories:active"],
  { revalidate: 300, tags: [CACHE_TAGS.catalog] },
);

const getHomepageBannersCached = unstable_cache(
  async () => {
    const now = new Date();
    return db.banner.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: "asc" },
    });
  },
  ["banners:homepage:active"],
  { revalidate: 120, tags: [CACHE_TAGS.banners] },
);

const getHomepageNewArrivalsCached = unstable_cache(
  async () => {
    return db.product.findMany({
      where: { status: "active" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 25,
      include: {
        images: {
          where: { kind: "image" },
          orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
      },
    });
  },
  ["catalog:new-arrivals"],
  { revalidate: 120, tags: [CACHE_TAGS.catalog] },
);

export async function getActiveCollections() {
  return getActiveCollectionsCached();
}

export async function getActiveCategories() {
  return getActiveCategoriesCached();
}

export async function getHomepageBanners() {
  return getHomepageBannersCached();
}

export async function getHomepageNewArrivals() {
  return getHomepageNewArrivalsCached();
}
