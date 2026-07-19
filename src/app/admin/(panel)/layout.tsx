import AdminSidebar from "@/components/admin/AdminSidebar";
import { adminLogout } from "@/lib/admin/auth-actions";
import { hasPermission, requireAdmin } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", permission: "reports" },
  { href: "/admin/products", label: "Products", permission: "catalog" },
  { href: "/admin/categories", label: "Categories", permission: "catalog" },
  { href: "/admin/collections", label: "Collections", permission: "catalog" },
  { href: "/admin/promotions", label: "Promotions", permission: "promotions" },
  { href: "/admin/coupons", label: "Coupons", permission: "promotions" },
  { href: "/admin/orders", label: "Orders", permission: "orders" },
  { href: "/admin/offline-sales", label: "D2C Sales", permission: "offline-sales" },
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
  ).map((item) => ({ href: item.href, label: item.label }));

  return (
    <div className="admin-shell">
      <AdminSidebar
        nav={nav}
        userName={session.name}
        roleLabel={(session.roleLabel || session.role).replace(/_/g, " ")}
        logoutAction={adminLogout}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
