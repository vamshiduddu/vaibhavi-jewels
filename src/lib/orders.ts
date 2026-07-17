import "server-only";
import { db } from "@/lib/db";

/**
 * Mark an order paid from a verified payment event. Idempotent: stock
 * deduction and coupon usage run only on the first transition to paid.
 */
export async function markOrderPaid(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  rawPayload?: unknown;
}) {
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
      include: { order: { include: { items: true } } },
    });
    if (!payment) throw new Error(`No payment for razorpay order ${params.razorpayOrderId}`);
    if (payment.status === "paid") return; // already processed

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        razorpayPaymentId: params.razorpayPaymentId,
        rawPayload: params.rawPayload ? JSON.parse(JSON.stringify(params.rawPayload)) : undefined,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "paid" },
    });

    // deduct stock after successful payment
    for (const item of payment.order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });
      await tx.stockAdjustment.create({
        data: {
          productId: item.productId,
          delta: -item.quantity,
          reason: `Order ${payment.order.orderNumber}`,
        },
      });
    }

    if (payment.order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: payment.order.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }
  });
}

export async function markOrderPaymentFailed(razorpayOrderId: string, rawPayload?: unknown) {
  const payment = await db.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment || payment.status === "paid") return;
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "failed",
      rawPayload: rawPayload ? JSON.parse(JSON.stringify(rawPayload)) : undefined,
    },
  });
}
