import { formatINR } from "@/lib/format";

export const ADMIN_PERMISSIONS = [
  "catalog",
  "content",
  "promotions",
  "orders",
  "customers",
  "inventory",
  "offline-sales",
  "purchases",
  "barcodes",
  "users",
  "reports",
  "settings",
  "orders:read",
  "inventory:read",
  "offline-sales:read",
  "purchases:read",
] as const;

export const ADMIN_PERMISSION_HELP = ADMIN_PERMISSIONS.join(", ");

export function saleSummaryText(total: number, count: number) {
  return `${count} item${count === 1 ? "" : "s"} · ${formatINR(total)}`;
}
