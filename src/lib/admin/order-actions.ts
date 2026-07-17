"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
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
  await db.order.update({ where: { id }, data: { status } });
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
