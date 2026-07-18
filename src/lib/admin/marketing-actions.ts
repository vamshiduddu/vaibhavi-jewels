"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

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

function optionalNum(formData: FormData, key: string): number | null {
  const raw = optional(formData, key);
  return raw === null ? null : num(formData, key);
}

function optionalDate(formData: FormData, key: string): Date | null {
  const raw = optional(formData, key);
  return raw === null ? null : new Date(raw);
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

// ---------- Promotions ----------

export async function savePromotion(formData: FormData) {
  await requireAdmin("promotions");
  const id = optional(formData, "id");
  const scope = str(formData, "scope") as
    | "sitewide"
    | "category"
    | "subcategory"
    | "collection"
    | "product";
  const data = {
    name: str(formData, "name"),
    label: optional(formData, "label"),
    scope,
    discountType: str(formData, "discountType") as "percentage" | "fixed",
    discountValue: num(formData, "discountValue"),
    categoryId: scope === "category" ? optional(formData, "categoryId") : null,
    subcategoryId: scope === "subcategory" ? optional(formData, "subcategoryId") : null,
    collectionId: scope === "collection" ? optional(formData, "collectionId") : null,
    productId: scope === "product" ? optional(formData, "productId") : null,
    minOrderValue: optionalNum(formData, "minOrderValue"),
    priority: num(formData, "priority"),
    active: bool(formData, "active"),
    startsAt: optionalDate(formData, "startsAt"),
    endsAt: optionalDate(formData, "endsAt"),
  };
  if (id) {
    await db.promotion.update({ where: { id }, data });
  } else {
    await db.promotion.create({ data });
  }
  revalidateTag(CACHE_TAGS.promotions, "max");
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function deletePromotion(formData: FormData) {
  await requireAdmin("promotions");
  await db.promotion.delete({ where: { id: str(formData, "id") } });
  revalidateTag(CACHE_TAGS.promotions, "max");
  revalidatePath("/admin/promotions");
}

// ---------- Coupons ----------

export async function saveCoupon(formData: FormData) {
  await requireAdmin("promotions");
  const id = optional(formData, "id");
  const data = {
    code: str(formData, "code").toUpperCase(),
    description: optional(formData, "description"),
    discountType: str(formData, "discountType") as "percentage" | "fixed",
    discountValue: num(formData, "discountValue"),
    minOrderValue: optionalNum(formData, "minOrderValue"),
    maxDiscount: optionalNum(formData, "maxDiscount"),
    usageLimit: optionalNum(formData, "usageLimit"),
    active: bool(formData, "active"),
    startsAt: optionalDate(formData, "startsAt"),
    endsAt: optionalDate(formData, "endsAt"),
  };
  if (id) {
    await db.coupon.update({ where: { id }, data });
  } else {
    await db.coupon.create({ data });
  }
  revalidateTag(CACHE_TAGS.promotions, "max");
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin("promotions");
  await db.coupon.delete({ where: { id: str(formData, "id") } });
  revalidateTag(CACHE_TAGS.promotions, "max");
  revalidatePath("/admin/coupons");
}

// ---------- Banners ----------

export async function saveBanner(formData: FormData) {
  await requireAdmin("content");
  const id = optional(formData, "id");
  const data = {
    title: str(formData, "title"),
    subtitle: optional(formData, "subtitle"),
    imageUrl: optional(formData, "imageUrl"),
    linkUrl: optional(formData, "linkUrl"),
    location: str(formData, "location") || "homepage_hero",
    sortOrder: num(formData, "sortOrder"),
    active: bool(formData, "active"),
    startsAt: optionalDate(formData, "startsAt"),
    endsAt: optionalDate(formData, "endsAt"),
  };
  if (id) {
    await db.banner.update({ where: { id }, data });
  } else {
    await db.banner.create({ data });
  }
  revalidateTag(CACHE_TAGS.banners, "max");
  revalidatePath("/admin/content");
  revalidatePath("/");
  redirect("/admin/content");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin("content");
  await db.banner.delete({ where: { id: str(formData, "id") } });
  revalidateTag(CACHE_TAGS.banners, "max");
  revalidatePath("/admin/content");
  revalidatePath("/");
}

// ---------- Homepage sections ----------

export async function saveSection(formData: FormData) {
  await requireAdmin("content");
  const key = str(formData, "key");
  const data = {
    title: optional(formData, "title"),
    kicker: optional(formData, "kicker"),
    body: optional(formData, "body"),
    ctaText: optional(formData, "ctaText"),
    ctaUrl: optional(formData, "ctaUrl"),
    imageUrl: optional(formData, "imageUrl"),
    sortOrder: num(formData, "sortOrder"),
    active: bool(formData, "active"),
  };
  await db.homepageSection.upsert({
    where: { key },
    create: { key, ...data },
    update: data,
  });
  revalidateTag(CACHE_TAGS.sections, "max");
  revalidatePath("/admin/content");
  revalidatePath("/");
}

// ---------- Settings ----------

export async function saveSettings(formData: FormData) {
  await requireAdmin("content");
  const entries = Array.from(formData.entries()).filter(
    ([key]) => !key.startsWith("$") && key !== "id",
  );
  for (const [key, value] of entries) {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
  }
  revalidateTag(CACHE_TAGS.settings, "max");
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
