import Link from "next/link";
import { adminLogout } from "@/lib/admin/auth-actions";
import { hasPermission, requireAdmin } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", permission: "reports" },
  { href: "/admin/products", label: "Products", permission: "catalog" },
  { href: "/admin/categories", label: "Categories", permission: "catalog" },
  { href: "/admin/subcategories", label: "Subcategories", permission: "catalog" },
  { href: "/admin/collections", label: "Collections", permission: "catalog" },
  { href: "/admin/promotions", label: "Promotions", permission: "promotions" },
  { href: "/admin/coupons", label: "Coupons", permission: "promotions" },
  { href: "/admin/orders", label: "Orders", permission: "orders" },
  { href: "/admin/offline-sales", label: "Offline Sales", permission: "offline-sales" },
  { href: "/admin/purchases", label: "Purchases", permission: "purchases" },
  { href: "/admin/customers", label: "Customers", permission: "customers" },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory" },
  { href: "/admin/barcodes", label: "Barcodes", permission: "barcodes" },
  { href: "/admin/users", label: "Users", permission: "users" },
  { href: "/admin/content", label: "Content", permission: "content" },
  { href: "/admin/settings", label: "Settings", permission: "settings" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const nav = NAV.filter((item) =>
    hasPermission(session.role, item.permission, {
      grantedPermissions: session.grantedPermissions,
      deniedPermissions: session.deniedPermissions,
    }),
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">Vaibhavi Admin</div>
        {nav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <div className="sidebar-footer">
          <div style={{ marginBottom: 8 }}>
            {session.name} · {(session.roleLabel || session.role).replace(/_/g, " ")}
          </div>
          <form action={adminLogout}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 6,
                color: "inherit",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 14px",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
