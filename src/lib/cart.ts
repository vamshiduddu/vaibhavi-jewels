import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  estimateWeightGrams,
  effectivePrice,
  evaluateCoupon,
  getActivePromotions,
  getShippingConfig,
  shippingFor,
} from "@/lib/pricing";

const CART_COOKIE = "vj_cart";

export async function getCartId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

/** Only call from server actions / route handlers (sets a cookie). */
export async function getOrCreateCartId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) {
    const cart = await db.cart.findUnique({ where: { id: existing } });
    if (cart) return cart.id;
  }
  const cart = await db.cart.create({ data: {} });
  jar.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

export type CartLine = {
  id: string;
  productId: string;
  title: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  compareAt: number | null;
  lineTotal: number;
  imageUrl: string | null;
  stockQuantity: number;
  weightGrams: number;
};

export type CartDetail = {
  id: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  couponError: string | null;
  totalWeightGrams: number;
  shipping: number;
  grandTotal: number;
};

const EMPTY_CART: CartDetail = {
  id: null,
  lines: [],
  itemCount: 0,
  subtotal: 0,
  couponCode: null,
  couponDiscount: 0,
  couponError: null,
  totalWeightGrams: 0,
  shipping: 0,
  grandTotal: 0,
};

export async function getCartDetail(): Promise<CartDetail> {
  const cartId = await getCartId();
  if (!cartId) return EMPTY_CART;

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { include: { images: { where: { kind: "image" }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }], take: 1 } } },
        },
      },
    },
  });
  if (!cart) return EMPTY_CART;

  const promotions = await getActivePromotions();

  const lines: CartLine[] = cart.items
    .filter((item) => item.product.status === "active")
    .map((item) => {
      const { price, compareAt } = effectivePrice(item.product, promotions);
      return {
        id: item.id,
        productId: item.productId,
        title: item.product.title,
        slug: item.product.slug,
        quantity: item.quantity,
        unitPrice: price,
        compareAt,
        lineTotal: Math.round(price * item.quantity * 100) / 100,
        imageUrl: item.product.images[0]?.url ?? null,
        stockQuantity: item.product.stockQuantity,
        weightGrams: item.product.weightGrams,
      };
    });

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  let couponDiscount = 0;
  let couponError: string | null = null;
  let couponCode: string | null = null;
  if (cart.coupon) {
    const result = evaluateCoupon(cart.coupon, subtotal);
    if (result.ok) {
      couponDiscount = result.discount;
      couponCode = cart.coupon.code;
    } else {
      couponError = result.error;
      couponCode = cart.coupon.code;
    }
  }

  const totalWeightGrams = estimateWeightGrams(lines);
  const shippingConfig = await getShippingConfig();
  const shipping = lines.length
    ? shippingFor({
        subtotalAfterDiscount: subtotal - couponDiscount,
        countryCode: "IN",
        totalWeightGrams,
        config: shippingConfig,
      })
    : 0;
  const grandTotal = Math.round((subtotal - couponDiscount + shipping) * 100) / 100;

  return {
    id: cart.id,
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    couponCode,
    couponDiscount,
    couponError,
    totalWeightGrams,
    shipping,
    grandTotal,
  };
}
