"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
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

// ---------- Categories ----------

export async function saveCategory(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");
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
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin("catalog");
  const id = str(formData, "id");
  await db.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

// ---------- Subcategories ----------

export async function saveSubcategory(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");
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
  revalidatePath("/admin/subcategories");
  redirect("/admin/subcategories");
}

export async function deleteSubcategory(formData: FormData) {
  await requireAdmin("catalog");
  await db.subcategory.delete({ where: { id: str(formData, "id") } });
  revalidatePath("/admin/subcategories");
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
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function deleteCollection(formData: FormData) {
  await requireAdmin("catalog");
  await db.collection.delete({ where: { id: str(formData, "id") } });
  revalidatePath("/admin/collections");
}

// ---------- Products ----------

export async function saveProduct(formData: FormData) {
  await requireAdmin("catalog");
  const id = optional(formData, "id");

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
    sku: optional(formData, "sku"),
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

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function archiveProduct(formData: FormData) {
  await requireAdmin("catalog");
  await db.product.update({
    where: { id: str(formData, "id") },
    data: { status: "archived" },
  });
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
