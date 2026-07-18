"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { AdminRole, OfflinePaymentMethod, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { effectivePrice, getActivePromotions } from "@/lib/pricing";
import { orderNumber } from "@/lib/format";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value || null;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function csv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function saveAdminUser(formData: FormData) {
  await requireAdmin("users");
  const id = optional(formData, "id");
  const password = str(formData, "password");
  const data = {
    email: str(formData, "email").toLowerCase(),
    name: str(formData, "name"),
    role: (str(formData, "role") || "support") as AdminRole,
    roleLabel: optional(formData, "roleLabel"),
    grantedPermissions: csv(str(formData, "grantedPermissions")),
    deniedPermissions: csv(str(formData, "deniedPermissions")),
    active: bool(formData, "active"),
  };

  if (!id && !password) {
    throw new Error("Password is required when creating an admin user.");
  }

  if (id) {
    await db.adminUser.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
  } else {
    await db.adminUser.create({
      data: {
        ...data,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
  }

  revalidatePath("/admin/users");
}

export async function saveSupplier(formData: FormData) {
  await requireAdmin("purchases");
  const id = optional(formData, "id");
  const data = {
    name: str(formData, "name"),
    contactName: optional(formData, "contactName"),
    phone: optional(formData, "phone"),
    email: optional(formData, "email"),
    address: optional(formData, "address"),
    notes: optional(formData, "notes"),
    active: bool(formData, "active"),
  };

  if (id) {
    await db.supplier.update({ where: { id }, data });
  } else {
    await db.supplier.create({ data });
  }

  revalidatePath("/admin/purchases");
}

export async function createOfflineSale(formData: FormData) {
  const session = await requireAdmin("offline-sales");
  const productId = str(formData, "productId");
  const quantity = num(formData, "quantity", 1);
  const manualDiscount = Math.max(0, num(formData, "discountTotal"));
  const paymentMethod = (str(formData, "paymentMethod") || "cash") as OfflinePaymentMethod;

  if (!productId || quantity < 1) return;

  const [product, promotions] = await Promise.all([
    db.product.findUnique({ where: { id: productId } }),
    getActivePromotions(),
  ]);
  if (!product) throw new Error("Product not found.");
  if (product.stockQuantity < quantity) {
    throw new Error(`Only ${product.stockQuantity} left for ${product.title}.`);
  }

  const pricing = effectivePrice(product, promotions);
  const subtotal = Number((pricing.price * quantity).toFixed(2));
  const discountTotal = Math.min(manualDiscount, subtotal);
  const grandTotal = Number((subtotal - discountTotal).toFixed(2));
  const saleNumber = `POS-${orderNumber().replace("VJ-", "")}`;

  await db.$transaction([
    db.offlineSale.create({
      data: {
        saleNumber,
        customerName: optional(formData, "customerName"),
        phone: optional(formData, "phone"),
        notes: optional(formData, "notes"),
        paymentMethod,
        subtotal,
        discountTotal,
        grandTotal,
        createdById: session.sub,
        items: {
          create: {
            productId: product.id,
            title: product.title,
            sku: product.sku,
            barcodeValue: product.barcodeValue,
            quantity,
            unitPrice: pricing.price,
            lineTotal: subtotal,
          },
        },
      },
    }),
    db.product.update({
      where: { id: product.id },
      data: { stockQuantity: { decrement: quantity } },
    }),
    db.stockAdjustment.create({
      data: {
        productId: product.id,
        delta: -quantity,
        reason: `Offline sale ${saleNumber}`,
        adminId: session.sub,
        source: "offline_sale",
      },
    }),
  ]);

  revalidatePath("/admin/offline-sales");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

function normalizeD2cSource(source: string): "manual_admin" | "whatsapp_order" {
  return source === "whatsapp" ? "whatsapp_order" : "manual_admin";
}

function normalizeOrderStatus(paymentStatus: string): "paid" | "payment_pending" | "pending" {
  if (paymentStatus === "paid") return "paid";
  if (paymentStatus === "payment_pending") return "payment_pending";
  return "pending";
}

function normalizePaymentStatus(paymentStatus: string): PaymentStatus {
  if (paymentStatus === "paid") return "paid";
  if (paymentStatus === "failed") return "failed";
  return "initiated";
}

export async function createSocialMediaSale(formData: FormData) {
  const session = await requireAdmin("offline-sales");
  const productId = str(formData, "productId");
  const quantity = num(formData, "quantity", 1);
  const sourceType = str(formData, "sourceType") || "other";
  const paymentStatus = str(formData, "paymentStatus") || "payment_pending";
  const shippingTotal = Math.max(0, num(formData, "shippingTotal"));
  const manualDiscount = Math.max(0, num(formData, "discountTotal"));
  const customerName = str(formData, "customerName");
  const phone = str(formData, "phone");
  const line1 = str(formData, "line1");
  const city = str(formData, "city");
  const state = str(formData, "state");
  const pincode = str(formData, "pincode");
  const country = str(formData, "country") || "India";

  if (!productId || quantity < 1) return;
  if (!customerName || !phone || !line1 || !city || !state || !pincode) {
    throw new Error("Customer address and contact details are required.");
  }

  const [product, promotions] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          where: { kind: "image" },
          orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
      },
    }),
    getActivePromotions(),
  ]);
  if (!product) throw new Error("Product not found.");
  if (product.stockQuantity < quantity) {
    throw new Error(`Only ${product.stockQuantity} left for ${product.title}.`);
  }

  const pricing = effectivePrice(product, promotions);
  const subtotal = Number((pricing.price * quantity).toFixed(2));
  const discountTotal = Math.min(manualDiscount, subtotal);
  const grandTotal = Number((subtotal - discountTotal + shippingTotal).toFixed(2));
  const orderStatus = normalizeOrderStatus(paymentStatus);
  const normalizedSource = normalizeD2cSource(sourceType);
  const noteParts = [
    "D2C social media sale",
    `source=${sourceType}`,
    optional(formData, "notes"),
  ].filter(Boolean);

  await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone },
      update: {
        name: customerName,
        email: optional(formData, "email")?.toLowerCase() ?? undefined,
      },
      create: {
        name: customerName,
        phone,
        email: optional(formData, "email")?.toLowerCase() ?? null,
      },
    });

    const address = await tx.address.create({
      data: {
        customerId: customer.id,
        name: customerName,
        phone,
        line1,
        line2: optional(formData, "line2"),
        city,
        state,
        pincode,
        country,
      },
    });

    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        customerId: customer.id,
        addressId: address.id,
        email: optional(formData, "email")?.toLowerCase() ?? null,
        phone,
        customerName,
        status: orderStatus,
        source: normalizedSource,
        subtotal,
        discountTotal,
        shippingTotal,
        grandTotal,
        internalNotes: noteParts.join(" | "),
        items: {
          create: {
            productId: product.id,
            title: product.title,
            sku: product.sku,
            unitPrice: pricing.price,
            quantity,
            lineTotal: subtotal,
            imageUrl: product.images[0]?.url ?? null,
          },
        },
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "manual_d2c",
        amount: grandTotal,
        currency: "INR",
        status: normalizePaymentStatus(paymentStatus),
        rawPayload: {
          sourceType,
          paymentStatus,
        },
      },
    });

    await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: { decrement: quantity } },
    });

    await tx.stockAdjustment.create({
      data: {
        productId: product.id,
        delta: -quantity,
        reason: `D2C social sale ${order.orderNumber} (${sourceType})`,
        adminId: session.sub,
        source: "social_sale",
      },
    });
  });

  revalidatePath("/admin/offline-sales");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

export async function createPurchaseRecord(formData: FormData) {
  const session = await requireAdmin("purchases");
  const productId = str(formData, "productId");
  const quantity = num(formData, "quantity", 1);
  const unitCost = num(formData, "unitCost", 0);
  if (!productId || quantity < 1 || unitCost < 0) return;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found.");

  const lineTotal = Number((unitCost * quantity).toFixed(2));

  await db.$transaction([
    db.purchaseRecord.create({
      data: {
        supplierId: optional(formData, "supplierId"),
        invoiceNumber: optional(formData, "invoiceNumber"),
        purchaseDate: optional(formData, "purchaseDate")
          ? new Date(str(formData, "purchaseDate"))
          : new Date(),
        notes: optional(formData, "notes"),
        totalCost: lineTotal,
        createdById: session.sub,
        items: {
          create: {
            productId: product.id,
            quantity,
            unitCost,
            lineTotal,
          },
        },
      },
    }),
    db.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: { increment: quantity },
        purchaseCost: unitCost,
      },
    }),
    db.stockAdjustment.create({
      data: {
        productId: product.id,
        delta: quantity,
        reason: `Purchase intake${str(formData, "invoiceNumber") ? ` · ${str(formData, "invoiceNumber")}` : ""}`,
        adminId: session.sub,
        source: "purchase_record",
      },
    }),
  ]);

  revalidatePath("/admin/purchases");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

export async function printBarcodeLabel(formData: FormData) {
  await requireAdmin("barcodes");
  const productId = str(formData, "productId");
  revalidatePath(`/admin/barcodes?productId=${productId}`);
}
