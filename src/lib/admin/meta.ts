import { formatINR } from "@/lib/format";

export const ADMIN_PERMISSION_HELP = [
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
].join(", ");

export function saleSummaryText(total: number, count: number) {
  return `${count} item${count === 1 ? "" : "s"} · ${formatINR(total)}`;
}
