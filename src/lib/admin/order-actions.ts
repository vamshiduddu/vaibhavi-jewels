"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const STATUSES: OrderStatus[] = [
  "pending",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin("orders");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!STATUSES.includes(status)) return;
  const paidLikeStatuses = new Set<OrderStatus>(["paid", "processing", "packed", "shipped", "delivered"]);
  const paymentStatus: PaymentStatus | null =
    status === "refunded" ? "refunded" : paidLikeStatuses.has(status) ? "paid" : null;

  await db.$transaction(async (tx) => {
    const order = await tx.order.update({ where: { id }, data: { status } });
    if (!paymentStatus) return;
    const latestPayment = await tx.payment.findFirst({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    });
    if (latestPayment) {
      await tx.payment.update({
        where: { id: latestPayment.id },
        data: { status: paymentStatus },
      });
    } else {
      await tx.payment.create({
        data: {
          orderId: id,
          provider: "manual_admin",
          amount: order.grandTotal,
          currency: "INR",
          status: paymentStatus,
        },
      });
    }
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function saveOrderNotes(formData: FormData) {
  await requireAdmin("orders");
  const id = String(formData.get("id") ?? "");
  const internalNotes = String(formData.get("internalNotes") ?? "").trim() || null;
  await db.order.update({ where: { id }, data: { internalNotes } });
  revalidatePath(`/admin/orders/${id}`);
}
