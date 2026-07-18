import { saveAdminUser } from "@/lib/admin/operations-actions";
import { ADMIN_PERMISSION_HELP } from "@/lib/admin/meta";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdmin("users");
  const { id } = await searchParams;
  const [admins, selected] = await Promise.all([
    db.adminUser.findMany({ orderBy: { createdAt: "desc" } }),
    id ? db.adminUser.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Users & Roles</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>
            {selected ? "Edit Admin User" : "Create Admin User"}
          </h3>
          <form action={saveAdminUser} className="admin-form">
            {selected ? <input type="hidden" name="id" value={selected.id} /> : null}
            <div className="form-row-2">
              <label>
                Name
                <input name="name" required defaultValue={selected?.name ?? ""} />
              </label>
              <label>
                Email
                <input name="email" type="email" required defaultValue={selected?.email ?? ""} />
              </label>
            </div>
            <div className="form-row-2">
              <label>
                Role
                <select name="role" defaultValue={selected?.role ?? "support"}>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="sub_admin">Sub Admin</option>
                  <option value="catalog_manager">Catalog Manager</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="order_manager">Order Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="accounts_manager">Accounts Manager</option>
                  <option value="store_staff">Store Staff</option>
                  <option value="support">Support</option>
                </select>
              </label>
              <label>
                Role Label (optional)
                <input name="roleLabel" defaultValue={selected?.roleLabel ?? ""} />
              </label>
            </div>
            <label>
              Password {selected ? "(leave blank to keep current password)" : ""}
              <input name="password" type="password" />
            </label>
            <label>
              Granted Permissions (comma separated)
              <input
                name="grantedPermissions"
                defaultValue={selected?.grantedPermissions.join(", ") ?? ""}
              />
            </label>
            <label>
              Denied Permissions (comma separated)
              <input
                name="deniedPermissions"
                defaultValue={selected?.deniedPermissions.join(", ") ?? ""}
              />
            </label>
            <p className="form-success" style={{ margin: 0 }}>
              Available permissions: {ADMIN_PERMISSION_HELP}
            </p>
            <label className="checkbox-label">
              <input type="checkbox" name="active" defaultChecked={selected?.active ?? true} />
              Active account
            </label>
            <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
              {selected ? "Update User" : "Create User"}
            </button>
          </form>
        </section>

        <section className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Current Admin Users</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    {admin.name}
                    <br />
                    <small style={{ color: "var(--muted)" }}>{admin.email}</small>
                  </td>
                  <td>{(admin.roleLabel || admin.role).replace(/_/g, " ")}</td>
                  <td>
                    <span className="pill">{admin.active ? "active" : "inactive"}</span>
                  </td>
                  <td>
                    <a href={`/admin/users?id=${admin.id}`} style={{ color: "var(--maroon)", fontWeight: 700 }}>
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
              {!admins.length ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    No admin users yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
