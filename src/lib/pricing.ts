import "server-only";
import type { Coupon, Product, Promotion } from "@prisma/client";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";

export type EffectivePrice = {
  /** price the customer pays now */
  price: number;
  /** original price when a discount applies, else null */
  compareAt: number | null;
  /** badge/label to show, e.g. "Festive Sale" or product badge */
  label: string | null;
};

function isWithinWindow(startsAt: Date | null, endsAt: Date | null, now: Date): boolean {
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const now = new Date();
  const promotions = await db.promotion.findMany({
    where: { active: true },
    orderBy: { priority: "desc" },
  });
  return promotions.filter((p) => isWithinWindow(p.startsAt, p.endsAt, now));
}

function promotionApplies(promo: Promotion, product: Product): boolean {
  switch (promo.scope) {
    case "sitewide":
      return true;
    case "category":
      return !!promo.categoryId && promo.categoryId === product.categoryId;
    case "subcategory":
      return !!promo.subcategoryId && promo.subcategoryId === product.subcategoryId;
    case "collection":
      return !!promo.collectionId && promo.collectionId === product.collectionId;
    case "product":
      return !!promo.productId && promo.productId === product.id;
    default:
      return false;
  }
}

function discountedPrice(base: number, type: "percentage" | "fixed", value: number): number {
  const next = type === "percentage" ? base * (1 - value / 100) : base - value;
  return Math.max(0, Math.round(next * 100) / 100);
}

/**
 * Best price for a product considering its own sale window and all active
 * promotions. Lowest resulting price wins; promotion priority breaks ties
 * via the pre-sorted promotions list.
 */
export function effectivePrice(product: Product, promotions: Promotion[]): EffectivePrice {
  const now = new Date();
  const base = toNumber(product.price);

  let best = base;
  let label: string | null = product.badge ?? null;

  if (
    product.salePrice !== null &&
    toNumber(product.salePrice) < best &&
    isWithinWindow(product.saleStartsAt, product.saleEndsAt, now)
  ) {
    best = toNumber(product.salePrice);
    label = product.badge ?? "Sale";
  }

  for (const promo of promotions) {
    if (!promotionApplies(promo, product)) continue;
    const candidate = discountedPrice(
      base,
      promo.discountType,
      toNumber(promo.discountValue),
    );
    if (candidate < best) {
      best = candidate;
      label = promo.label ?? promo.name;
    }
  }

  if (best < base) {
    return { price: best, compareAt: base, label };
  }

  const compareAt =
    product.compareAtPrice && toNumber(product.compareAtPrice) > base
      ? toNumber(product.compareAtPrice)
      : null;
  return { price: base, compareAt, label };
}

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

export function evaluateCoupon(coupon: Coupon | null, subtotal: number): CouponResult {
  if (!coupon || !coupon.active) return { ok: false, error: "Invalid coupon code." };
  const now = new Date();
  if (!isWithinWindow(coupon.startsAt, coupon.endsAt, now)) {
    return { ok: false, error: "This coupon has expired." };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has reached its usage limit." };
  }
  if (coupon.minOrderValue !== null && subtotal < toNumber(coupon.minOrderValue)) {
    return {
      ok: false,
      error: `This coupon needs a minimum order of ₹${toNumber(coupon.minOrderValue)}.`,
    };
  }
  let discount =
    coupon.discountType === "percentage"
      ? (subtotal * toNumber(coupon.discountValue)) / 100
      : toNumber(coupon.discountValue);
  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, toNumber(coupon.maxDiscount));
  }
  discount = Math.min(Math.round(discount * 100) / 100, subtotal);
  return { ok: true, coupon, discount };
}

export async function getShippingConfig(): Promise<{ flatRate: number; freeThreshold: number }> {
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["shipping_flat_rate", "free_shipping_threshold"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    flatRate: Number(map.shipping_flat_rate ?? 79),
    freeThreshold: Number(map.free_shipping_threshold ?? 999),
  };
}

export function shippingFor(subtotalAfterDiscount: number, config: { flatRate: number; freeThreshold: number }): number {
  if (subtotalAfterDiscount <= 0) return 0;
  return subtotalAfterDiscount >= config.freeThreshold ? 0 : config.flatRate;
}
