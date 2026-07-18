"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { generateProductSocialContent } from "@/lib/ai";
import { generateProductBarcodeValue, normalizeBarcodeValue } from "@/lib/barcode";
import { slugify } from "@/lib/format";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value === "" ? null : value;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function slugFrom(formData: FormData, nameKey = "name"): string {
  const explicit = str(formData, "slug");
  return slugify(explicit || str(formData, nameKey));
}

function defaultSeoDescription(shortDescription: string | null, description: string | null): string | null {
  if (shortDescription) return shortDescription;
  if (!description) return null;
  return description.replace(/\s+/g, " ").trim().slice(0, 160) || null;
}

async function generateUniqueSku(title: string): Promise<string> {
  const titlePart = slugify(title)
    .replace(/-/g, "")
    .toUpperCase()
    .slice(0, 4) || "ITEM";
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const sku = `VJ-${titlePart}-${ymd}-${suffix}`;
    const existing = await db.product.findUnique({
      where: { sku },
      select: { id: true },
    });
    if (!existing) return sku;
  }

  return `VJ-${titlePart}-${Date.now().toString(36).toUpperCase()}`;
}

async function buildAndStoreProductAiContent(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      description: true,
      price: true,
      sku: true,
      tags: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
    },
  });
  if (!product) throw new Error("Product not found.");

  const aiContent = await generateProductSocialContent({
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    sku: product.sku,
    tags: product.tags,
    categoryName: product.category?.name ?? null,
    subcategoryName: product.subcategory?.name ?? null,
  });

  if (!aiContent) return null;

  await db.product.update({
    where: { id: productId },
    data: {
      aiInstagramCaption: aiContent.instagramCaption || null,
      aiYoutubeTitle: aiContent.youtubeTitle || null,
      aiYoutubeDescription: aiContent.youtubeDescription || null,
    },
  });

  return aiContent;
}

// ---------- Categories ----------

export async function saveCategory(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");
  const redirectTo = optional(formData, "redirectTo") ?? "/admin/categories";
  const data = {
    name: str(formData, "name"),
    slug: slugFrom(formData),
    description: optional(formData, "description"),
    image: optional(formData, "image"),
    sortOrder: num(formData, "sortOrder"),
    active: bool(formData, "active"),
    seoTitle: optional(formData, "seoTitle"),
    seoDescription: optional(formData, "seoDescription"),
  };
  if (id) {
    await db.category.update({ where: { id }, data });
  } else {
    await db.category.create({ data });
  }
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/categories");
  redirect(redirectTo);
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin("catalog");
  const id = str(formData, "id");
  const redirectTo = optional(formData, "redirectTo") ?? "/admin/categories";
  await db.category.delete({ where: { id } });
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/categories");
  redirect(redirectTo);
}

// ---------- Subcategories ----------

export async function saveSubcategory(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");
  const redirectTo = optional(formData, "redirectTo") ?? "/admin/categories";
  const data = {
    categoryId: str(formData, "categoryId"),
    name: str(formData, "name"),
    slug: slugFrom(formData),
    description: optional(formData, "description"),
    sortOrder: num(formData, "sortOrder"),
    active: bool(formData, "active"),
  };
  if (id) {
    await db.subcategory.update({ where: { id }, data });
  } else {
    await db.subcategory.create({ data });
  }
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/subcategories");
  redirect(redirectTo);
}

export async function deleteSubcategory(formData: FormData) {
  await requireAdmin("catalog");
  const redirectTo = optional(formData, "redirectTo") ?? "/admin/categories";
  await db.subcategory.delete({ where: { id: str(formData, "id") } });
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/subcategories");
  redirect(redirectTo);
}

// ---------- Collections ----------

export async function saveCollection(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");
  const data = {
    name: str(formData, "name"),
    slug: slugFrom(formData),
    description: optional(formData, "description"),
    image: optional(formData, "image"),
    sortOrder: num(formData, "sortOrder"),
    active: bool(formData, "active"),
    featured: bool(formData, "featured"),
    seoTitle: optional(formData, "seoTitle"),
    seoDescription: optional(formData, "seoDescription"),
  };
  if (id) {
    await db.collection.update({ where: { id }, data });
  } else {
    await db.collection.create({ data });
  }
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function deleteCollection(formData: FormData) {
  await requireAdmin("catalog");
  await db.collection.delete({ where: { id: str(formData, "id") } });
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/collections");
}

// ---------- Products ----------

export async function saveProduct(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");
  const rawSku = optional(formData, "sku");

  let media: { url: string; kind: "image" | "video" }[] = [];
  try {
    const parsed = JSON.parse(str(formData, "media") || "[]");
    if (Array.isArray(parsed)) {
      media = parsed
        .filter((m) => m && typeof m.url === "string" && m.url.trim())
        .map((m) => ({ url: m.url.trim(), kind: m.kind === "video" ? "video" : "image" }));
    }
  } catch {
    media = [];
  }

  const data = {
    title: str(formData, "title"),
    slug: slugFrom(formData, "title"),
    shortDescription: optional(formData, "shortDescription"),
    description: optional(formData, "description"),
    price: num(formData, "price"),
    compareAtPrice: optional(formData, "compareAtPrice") ? num(formData, "compareAtPrice") : null,
    purchaseCost: optional(formData, "purchaseCost") ? num(formData, "purchaseCost") : null,
    weightGrams: Math.max(1, num(formData, "weightGrams", 250)),
    sku: rawSku,
    barcodeValue: null as string | null,
    barcodeType: (str(formData, "barcodeType") || "code39") as "code39" | "code128" | "qr",
    stockQuantity: num(formData, "stockQuantity"),
    lowStockThreshold: num(formData, "lowStockThreshold", 3),
    categoryId: optional(formData, "categoryId"),
    subcategoryId: optional(formData, "subcategoryId"),
    collectionId: optional(formData, "collectionId"),
    tags: str(formData, "tags")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    status: (str(formData, "status") || "draft") as "draft" | "active" | "archived",
    featured: bool(formData, "featured"),
    badge: optional(formData, "badge"),
    color: optional(formData, "color"),
    material: optional(formData, "material"),
    occasion: optional(formData, "occasion"),
    salePrice: optional(formData, "salePrice") ? num(formData, "salePrice") : null,
    saleStartsAt: optional(formData, "saleStartsAt")
      ? new Date(str(formData, "saleStartsAt"))
      : null,
    saleEndsAt: optional(formData, "saleEndsAt") ? new Date(str(formData, "saleEndsAt")) : null,
    sortOrder: num(formData, "sortOrder"),
    seoTitle: optional(formData, "seoTitle"),
    seoDescription: optional(formData, "seoDescription"),
  };
  data.seoTitle = data.seoTitle || data.title;
  data.seoDescription = data.seoDescription || defaultSeoDescription(data.shortDescription, data.description);
  data.sku = rawSku || (await generateUniqueSku(data.title));
  data.barcodeValue =
    normalizeBarcodeValue(optional(formData, "barcodeValue") || "") ||
    generateProductBarcodeValue({ sku: data.sku, title: data.title });

  let productId: string;
  if (id) {
    await db.product.update({ where: { id }, data });
    productId = id;
  } else {
    const created = await db.product.create({ data });
    productId = created.id;
  }

  // replace media list; first image is the featured/cover image
  const firstImageIdx = media.findIndex((m) => m.kind === "image");
  await db.productImage.deleteMany({ where: { productId } });
  if (media.length) {
    await db.productImage.createMany({
      data: media.map((m, index) => ({
        productId,
        url: m.url,
        kind: m.kind,
        sortOrder: index,
        featured: index === firstImageIdx,
        alt: data.title,
      })),
    });
  }

  const existingAi = id
    ? await db.product.findUnique({
        where: { id: productId },
        select: {
          aiInstagramCaption: true,
          aiYoutubeTitle: true,
          aiYoutubeDescription: true,
        },
      })
    : null;
  const hasExistingAi = Boolean(
    existingAi?.aiInstagramCaption || existingAi?.aiYoutubeTitle || existingAi?.aiYoutubeDescription,
  );
  if (!hasExistingAi) {
    await buildAndStoreProductAiContent(productId).catch(() => null);
  }

  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function generateProductAiContent(formData: FormData) {
  await requireAdmin("catalog");
  const productId = str(formData, "productId");
  if (!productId) return;
  await buildAndStoreProductAiContent(productId);
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath(`/admin/products/${productId}`);
}

export async function archiveProduct(formData: FormData) {
  await requireAdmin("catalog");
  await db.product.update({
    where: { id: str(formData, "id") },
    data: { status: "archived" },
  });
  revalidateTag(CACHE_TAGS.catalog, "max");
  revalidatePath("/admin/products");
}

export async function adjustStock(formData: FormData) {
  const session = await requireAdmin("inventory");
  const productId = str(formData, "productId");
  const delta = num(formData, "delta");
  const reason = str(formData, "reason") || "Manual adjustment";
  if (!delta) return;
  await db.$transaction([
    db.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: delta } },
    }),
    db.stockAdjustment.create({
      data: { productId, delta, reason, adminId: session.sub },
    }),
  ]);
  revalidatePath("/admin/inventory");
}
