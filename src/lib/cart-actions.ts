"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCartId, getOrCreateCartId } from "@/lib/cart";

export async function addToCart(productId: string, quantity = 1) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "active") {
    return { ok: false, error: "This product is not available." };
  }
  if (product.stockQuantity < 1) {
    return { ok: false, error: "This product is out of stock." };
  }

  const cartId = await getOrCreateCartId();
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
  const nextQty = Math.min((existing?.quantity ?? 0) + quantity, product.stockQuantity);

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: Math.min(quantity, product.stockQuantity) },
    update: { quantity: nextQty },
  });

  revalidatePath("/cart");
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) return;
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });
  if (!item || item.cartId !== cartId) return;

  if (quantity < 1) {
    await db.cartItem.delete({ where: { id: itemId } });
  } else {
    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.min(quantity, item.product.stockQuantity) },
    });
  }
  revalidatePath("/cart");
}

export async function removeCartItem(itemId: string) {
  const cartId = await getCartId();
  if (!cartId) return;
  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cartId) return;
  await db.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/cart");
}

export async function applyCoupon(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return;
  const cartId = await getOrCreateCartId();
  const coupon = await db.coupon.findUnique({ where: { code } });
  await db.cart.update({
    where: { id: cartId },
    data: { couponId: coupon?.id ?? null },
  });
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function removeCoupon() {
  const cartId = await getCartId();
  if (!cartId) return;
  await db.cart.update({ where: { id: cartId }, data: { couponId: null } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
