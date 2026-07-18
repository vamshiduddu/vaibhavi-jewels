import { createPurchaseRecord, saveSupplier } from "@/lib/admin/operations-actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function AdminPurchasesPage() {
  await requireAdmin("purchases");
  const [products, suppliers, purchases] = await Promise.all([
    db.product.findMany({
      where: { status: { not: "archived" } },
      orderBy: { title: "asc" },
      select: { id: true, title: true, sku: true },
    }),
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.purchaseRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        supplier: true,
        createdBy: true,
        items: { include: { product: true } },
      },
    }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Purchases</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Record Stock Intake</h3>
          <form action={createPurchaseRecord} className="admin-form">
            <label>
              Product
              <select name="productId" required>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} {product.sku ? `· ${product.sku}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row-2">
              <label>
                Supplier
                <select name="supplierId" defaultValue="">
                  <option value="">No supplier selected</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Invoice Number
                <input name="invoiceNumber" />
              </label>
            </div>
            <div className="form-row-2">
              <label>
                Quantity
                <input name="quantity" type="number" min="1" defaultValue={1} required />
              </label>
              <label>
                Unit Cost (Rs.)
                <input name="unitCost" type="number" min="0" step="0.01" required />
              </label>
            </div>
            <label>
              Purchase Date
              <input name="purchaseDate" type="datetime-local" />
            </label>
            <label>
              Notes
              <textarea name="notes" />
            </label>
            <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
              Save Purchase Record
            </button>
          </form>
        </section>

        <section className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Add Supplier</h3>
          <form action={saveSupplier} className="admin-form">
            <label>
              Supplier Name
              <input name="name" required />
            </label>
            <div className="form-row-2">
              <label>
                Contact Name
                <input name="contactName" />
              </label>
              <label>
                Phone
                <input name="phone" />
              </label>
            </div>
            <label>
              Email
              <input name="email" type="email" />
            </label>
            <label>
              Address
              <textarea name="address" />
            </label>
            <label>
              Notes
              <textarea name="notes" />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="active" defaultChecked />
              Active supplier
            </label>
            <button className="secondary-button" type="submit" style={{ width: "fit-content" }}>
              Save Supplier
            </button>
          </form>
        </section>
      </div>

      <div className="admin-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recent Purchases</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total Cost</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => {
              const item = purchase.items[0];
              return (
                <tr key={purchase.id}>
                  <td>
                    {purchase.purchaseDate.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>{purchase.supplier?.name ?? "Direct purchase"}</td>
                  <td>{item?.product.title ?? "—"}</td>
                  <td>{item?.quantity ?? 0}</td>
                  <td>{formatINR(purchase.totalCost)}</td>
                  <td>{purchase.createdBy?.name ?? "System"}</td>
                </tr>
              );
            })}
            {!purchases.length ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  No purchase records yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
