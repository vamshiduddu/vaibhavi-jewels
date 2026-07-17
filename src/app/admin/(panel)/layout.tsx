import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminLogout } from "@/lib/admin/auth-actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/subcategories", label: "Subcategories" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">Vaibhavi Admin</div>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <div className="sidebar-footer">
          <div style={{ marginBottom: 8 }}>
            {session.name} · {session.role.replace(/_/g, " ")}
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
