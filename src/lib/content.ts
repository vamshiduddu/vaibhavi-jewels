import "server-only";
import { db } from "@/lib/db";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSection(key: string) {
  const section = await db.homepageSection.findUnique({ where: { key } });
  return section?.active ? section : null;
}

export async function getSections() {
  const rows = await db.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
  return Object.fromEntries(rows.map((r) => [r.key, r]));
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

/**
 * Online payments run only when the admin flag is on AND Razorpay keys exist.
 * Otherwise checkout falls back to manual orders (payment collected on WhatsApp).
 */
export async function onlinePaymentsEnabled(): Promise<boolean> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return false;
  const setting = await db.siteSetting.findUnique({ where: { key: "online_payments_enabled" } });
  return (setting?.value ?? "true") === "true";
}
