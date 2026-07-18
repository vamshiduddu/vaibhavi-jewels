"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCartDetail, getCartId } from "@/lib/cart";
import { onlinePaymentsEnabled } from "@/lib/content";
import { orderNumber } from "@/lib/format";
import { getShippingConfig, shippingFor } from "@/lib/pricing";
import { razorpayClient } from "@/lib/razorpay";

const checkoutSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
  line1: z.string().min(3, "Please enter your address."),
  line2: z.string().optional(),
  city: z.string().min(2, "Please enter your city."),
  state: z.string().min(2, "Please enter your state."),
  pincode: z.string().min(6, "Please enter a valid pincode.").max(6),
  country: z.string().min(2, "Please select your country."),
});

export type PlaceOrderResult =
  | {
      ok: true;
      mode: "razorpay";
      orderId: string;
      orderNumber: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      name: string;
      email: string | null;
      phone: string;
    }
  | { ok: true; mode: "manual"; orderId: string; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(formData: FormData): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    country: formData.get("country"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  const input = parsed.data;
  const email = input.email ? input.email.toLowerCase() : null;

  const cartId = await getCartId();
  const cart = await getCartDetail();
  if (!cartId || !cart.lines.length) {
    return { ok: false, error: "Your cart is empty." };
  }
  for (const line of cart.lines) {
    if (line.stockQuantity < line.quantity) {
      return {
        ok: false,
        error: `Only ${line.stockQuantity} of "${line.title}" left in stock. Please update your cart.`,
      };
    }
  }
  if (cart.couponError) {
    return { ok: false, error: cart.couponError };
  }

  const useRazorpay = await onlinePaymentsEnabled();
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const shippingConfig = await getShippingConfig();
  const countryLabel =
    shippingConfig.supportedCountries.find((country) => country.code === input.country)?.label ?? input.country;
  const recalculatedShipping = shippingFor({
    subtotalAfterDiscount: cart.subtotal - cart.couponDiscount,
    countryCode: input.country,
    totalWeightGrams: cart.totalWeightGrams,
    config: shippingConfig,
  });
  const grandTotal = Math.round((cart.subtotal - cart.couponDiscount + recalculatedShipping) * 100) / 100;

  // guest checkout: attach to an existing customer only when email/phone matches
  let customerId: string | null = null;
  if (email || input.phone) {
    const existing = await db.customer.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), { phone: input.phone }],
      },
    });
    if (existing) {
      customerId = existing.id;
    } else {
      const created = await db.customer.create({
        data: { email, phone: input.phone, name: input.name },
      });
      customerId = created.id;
    }
  }

  const address = await db.address.create({
    data: {
      customerId,
      name: input.name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      country: countryLabel,
    },
  });

  const order = await db.order.create({
    data: {
      orderNumber: orderNumber(),
      customerId,
      addressId: address.id,
      email,
      phone: input.phone,
      customerName: input.name,
      status: useRazorpay ? "payment_pending" : "pending",
      subtotal: cart.subtotal,
      discountTotal: cart.couponDiscount,
      shippingTotal: recalculatedShipping,
      grandTotal,
      couponCode: cart.couponDiscount > 0 ? cart.couponCode : null,
      items: {
        create: cart.lines.map((line) => ({
          productId: line.productId,
          title: line.title,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
          imageUrl: line.imageUrl,
        })),
      },
    },
  });

  if (!useRazorpay) {
    // manual order: reserve stock now, collect payment over WhatsApp
    await db.$transaction(async (tx) => {
      for (const line of cart.lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stockQuantity: { decrement: line.quantity } },
        });
        await tx.stockAdjustment.create({
          data: {
            productId: line.productId,
            delta: -line.quantity,
            reason: `Order ${order.orderNumber} (manual)`,
          },
        });
      }
      if (cart.couponDiscount > 0 && cart.couponCode) {
        await tx.coupon.updateMany({
          where: { code: cart.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }
      await tx.cart.deleteMany({ where: { id: cartId } });
    });
    const jar = await cookies();
    jar.delete("vj_cart");
    return { ok: true, mode: "manual", orderId: order.id, orderNumber: order.orderNumber };
  }

  const amountPaise = Math.round(grandTotal * 100);
  let razorpayOrder;
  try {
    razorpayOrder = await razorpayClient().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order.id },
    });
  } catch {
    await db.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
    return { ok: false, error: "Could not start the payment. Please try again." };
  }

  await db.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: grandTotal,
      currency: "INR",
      status: "initiated",
    },
  });

  return {
    ok: true,
    mode: "razorpay",
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: amountPaise,
    currency: "INR",
    keyId,
    name: input.name,
    email,
    phone: input.phone,
  };
}
