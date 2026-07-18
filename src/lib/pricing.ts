import "server-only";
import { unstable_cache } from "next/cache";
import type { Coupon, Product, Promotion } from "@prisma/client";
import { CACHE_TAGS } from "@/lib/cache";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";

export type EffectivePrice = {
  price: number;
  compareAt: number | null;
  label: string | null;
};

export type ShippingCountry = {
  code: string;
  label: string;
};

export type ShippingRule = {
  countryCode: string;
  minWeightGrams: number;
  maxWeightGrams: number | null;
  rate: number;
  freeThreshold?: number | null;
};

export type ShippingConfig = {
  flatRate: number;
  freeThreshold: number;
  supportedCountries: ShippingCountry[];
  rules: ShippingRule[];
};

const DEFAULT_COUNTRIES: ShippingCountry[] = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "NO", label: "Norway" },
  { code: "NZ", label: "New Zealand" },
];

const DEFAULT_RULES: ShippingRule[] = [
  { countryCode: "IN", minWeightGrams: 0, maxWeightGrams: 500, rate: 79, freeThreshold: 999 },
  { countryCode: "IN", minWeightGrams: 501, maxWeightGrams: 1000, rate: 129, freeThreshold: 1499 },
  { countryCode: "IN", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 199, freeThreshold: 2499 },
  { countryCode: "US", minWeightGrams: 0, maxWeightGrams: 500, rate: 1800 },
  { countryCode: "US", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3200 },
  { countryCode: "US", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 5200 },
  { countryCode: "CA", minWeightGrams: 0, maxWeightGrams: 500, rate: 1800 },
  { countryCode: "CA", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3200 },
  { countryCode: "CA", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 5200 },
  { countryCode: "GB", minWeightGrams: 0, maxWeightGrams: 500, rate: 1700 },
  { countryCode: "GB", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3000 },
  { countryCode: "GB", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 4900 },
  { countryCode: "AU", minWeightGrams: 0, maxWeightGrams: 500, rate: 1800 },
  { countryCode: "AU", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3300 },
  { countryCode: "AU", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 5400 },
  { countryCode: "DE", minWeightGrams: 0, maxWeightGrams: 500, rate: 1750 },
  { countryCode: "DE", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3100 },
  { countryCode: "DE", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 5000 },
  { countryCode: "NO", minWeightGrams: 0, maxWeightGrams: 500, rate: 1800 },
  { countryCode: "NO", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3200 },
  { countryCode: "NO", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 5200 },
  { countryCode: "NZ", minWeightGrams: 0, maxWeightGrams: 500, rate: 1850 },
  { countryCode: "NZ", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3350 },
  { countryCode: "NZ", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 5450 },
  { countryCode: "OTHER", minWeightGrams: 0, maxWeightGrams: 500, rate: 2200 },
  { countryCode: "OTHER", minWeightGrams: 501, maxWeightGrams: 1000, rate: 3900 },
  { countryCode: "OTHER", minWeightGrams: 1001, maxWeightGrams: 2000, rate: 6200 },
];

function isWithinWindow(startsAt: Date | null, endsAt: Date | null, now: Date): boolean {
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

const getPromotionsCached = unstable_cache(
  async () => {
    const now = new Date();
    const promotions = await db.promotion.findMany({
      where: { active: true },
      orderBy: { priority: "desc" },
    });
    return promotions.filter((p) => isWithinWindow(p.startsAt, p.endsAt, now));
  },
  ["promotions:active"],
  { revalidate: 120, tags: [CACHE_TAGS.promotions] },
);

export async function getActivePromotions(): Promise<Promotion[]> {
  return getPromotionsCached();
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
    const candidate = discountedPrice(base, promo.discountType, toNumber(promo.discountValue));
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

function parseCountries(raw: string | undefined): ShippingCountry[] {
  if (!raw) return DEFAULT_COUNTRIES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COUNTRIES;
    const countries = parsed
      .filter((item) => item && typeof item.code === "string" && typeof item.label === "string")
      .map((item) => ({
        code: item.code.toUpperCase().trim(),
        label: item.label.trim(),
      }))
      .filter((item) => item.code && item.label);
    return countries.length ? countries : DEFAULT_COUNTRIES;
  } catch {
    return DEFAULT_COUNTRIES;
  }
}

function parseRules(raw: string | undefined): ShippingRule[] {
  if (!raw) return DEFAULT_RULES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_RULES;
    const rules = parsed
      .filter((item) => item && typeof item.countryCode === "string" && Number.isFinite(Number(item.rate)))
      .map((item) => ({
        countryCode: String(item.countryCode).toUpperCase().trim(),
        minWeightGrams: Math.max(0, Number(item.minWeightGrams ?? 0)),
        maxWeightGrams:
          item.maxWeightGrams === null || item.maxWeightGrams === undefined
            ? null
            : Math.max(0, Number(item.maxWeightGrams)),
        rate: Math.max(0, Number(item.rate)),
        freeThreshold:
          item.freeThreshold === null || item.freeThreshold === undefined
            ? null
            : Math.max(0, Number(item.freeThreshold)),
      }))
      .filter((item) => item.countryCode);
    return rules.length ? rules : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

const getShippingConfigCached = unstable_cache(
  async () => {
    const settings = await db.siteSetting.findMany({
      where: {
        key: {
          in: [
            "shipping_flat_rate",
            "free_shipping_threshold",
            "shipping_supported_countries",
            "shipping_rules_json",
          ],
        },
      },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      flatRate: Number(map.shipping_flat_rate ?? 79),
      freeThreshold: Number(map.free_shipping_threshold ?? 999),
      supportedCountries: parseCountries(map.shipping_supported_countries),
      rules: parseRules(map.shipping_rules_json),
    } satisfies ShippingConfig;
  },
  ["settings:shipping"],
  { revalidate: 300, tags: [CACHE_TAGS.settings] },
);

export async function getShippingConfig(): Promise<ShippingConfig> {
  return getShippingConfigCached();
}

export function estimateWeightGrams(lines: Array<{ quantity: number; weightGrams?: number | null }>): number {
  const total = lines.reduce(
    (sum, line) => sum + Math.max(0, Number(line.weightGrams ?? 250)) * Math.max(0, line.quantity),
    0,
  );
  return Math.max(0, total);
}

function findRule(countryCode: string, totalWeightGrams: number, config: ShippingConfig): ShippingRule | null {
  const code = countryCode.toUpperCase();
  const rules = config.rules
    .filter((rule) => rule.countryCode === code || rule.countryCode === "OTHER")
    .sort((left, right) => left.minWeightGrams - right.minWeightGrams);
  return (
    rules.find(
      (rule) =>
        (rule.countryCode === code || (rule.countryCode === "OTHER" && !rules.some((r) => r.countryCode === code))) &&
        totalWeightGrams >= rule.minWeightGrams &&
        (rule.maxWeightGrams === null || totalWeightGrams <= rule.maxWeightGrams),
    ) ?? null
  );
}

export function shippingFor(params: {
  subtotalAfterDiscount: number;
  countryCode: string;
  totalWeightGrams: number;
  config: ShippingConfig;
}): number {
  const { subtotalAfterDiscount, countryCode, totalWeightGrams, config } = params;
  if (subtotalAfterDiscount <= 0) return 0;
  const rule = findRule(countryCode, totalWeightGrams, config);
  if (!rule) return countryCode.toUpperCase() === "IN" ? config.flatRate : 0;
  const freeThreshold =
    rule.freeThreshold ?? (countryCode.toUpperCase() === "IN" ? config.freeThreshold : null);
  if (freeThreshold !== null && subtotalAfterDiscount >= freeThreshold) return 0;
  return rule.rate;
}
