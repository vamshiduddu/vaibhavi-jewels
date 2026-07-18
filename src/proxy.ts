import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
  admin: [
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
  ],
  sub_admin: [],
  catalog_manager: ["catalog"],
  content_manager: ["content", "promotions"],
  inventory_manager: ["inventory", "barcodes", "purchases"],
  order_manager: ["orders", "customers", "inventory"],
  supervisor: ["orders", "customers", "inventory:read", "reports", "offline-sales:read", "purchases:read"],
  accounts_manager: ["orders:read", "customers:read", "promotions:read", "purchases", "reports"],
  store_staff: ["offline-sales", "barcodes:read", "inventory:read", "customers:read"],
  support: ["orders:read", "customers:read"],
};

const ROUTE_PERMISSIONS: Array<[prefix: string, permission: string]> = [
  ["/admin/products", "catalog"],
  ["/admin/categories", "catalog"],
  ["/admin/subcategories", "catalog"],
  ["/admin/collections", "catalog"],
  ["/admin/promotions", "promotions"],
  ["/admin/coupons", "promotions"],
  ["/admin/orders", "orders"],
  ["/admin/customers", "customers"],
  ["/admin/inventory", "inventory"],
  ["/admin/offline-sales", "offline-sales"],
  ["/admin/purchases", "purchases"],
  ["/admin/barcodes", "barcodes"],
  ["/admin/users", "users"],
  ["/admin/content", "content"],
  ["/admin/settings", "settings"],
];

function hasPermission(
  role: string,
  permission: string,
  grantedPermissions: string[] = [],
  deniedPermissions: string[] = [],
) {
  const grants = new Set(ROLE_PERMISSIONS[role] ?? []);
  const scope = permission.split(":")[0];
  if (deniedPermissions.includes(permission) || deniedPermissions.includes(scope)) return false;
  if (grants.has("*") || grantedPermissions.includes("*")) return true;
  return (
    grants.has(permission) ||
    grants.has(scope) ||
    grantedPermissions.includes(permission) ||
    grantedPermissions.includes(scope)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("vj_admin")?.value;
  const loginUrl = new URL("/admin/login", request.url);
  const homeUrl = new URL("/admin", request.url);

  if (!token || !process.env.AUTH_SECRET) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    const role = String(payload.role ?? "support");
    const grantedPermissions = Array.isArray(payload.grantedPermissions)
      ? payload.grantedPermissions.map(String)
      : [];
    const deniedPermissions = Array.isArray(payload.deniedPermissions)
      ? payload.deniedPermissions.map(String)
      : [];

    const matched = ROUTE_PERMISSIONS.find(([prefix]) => pathname.startsWith(prefix));
    if (matched && !hasPermission(role, matched[1], grantedPermissions, deniedPermissions)) {
      return NextResponse.redirect(homeUrl);
    }

    if (pathname === "/admin" && !hasPermission(role, "reports", grantedPermissions, deniedPermissions)) {
      return NextResponse.redirect(new URL("/admin/offline-sales", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
