import { db } from "@/lib/db";
import { adjustStock } from "@/lib/admin/catalog-actions";

export default async function AdminInventoryPage() {
  const [products, recent] = await Promise.all([
    db.product.findMany({
      where: { status: { not: "archived" } },
      orderBy: { stockQuantity: "asc" },
    }),
    db.stockAdjustment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { product: true },
    }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Inventory</h1>
      </div>
      <table className="admin-table" style={{ marginBottom: 34 }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Stock</th>
            <th>Adjust</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                {product.title}
                {product.stockQuantity <= product.lowStockThreshold ? (
                  <span className="pill" style={{ marginLeft: 8, background: "rgba(116,19,30,0.12)", color: "var(--rose)" }}>
                    {product.stockQuantity < 1 ? "out of stock" : "low stock"}
                  </span>
                ) : null}
              </td>
              <td>{product.sku ?? "—"}</td>
              <td>{product.stockQuantity}</td>
              <td>
                <form action={adjustStock} style={{ display: "flex", gap: 8 }}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input
                    name="delta"
                    type="number"
                    placeholder="+5 / -2"
                    style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 10px", width: 90 }}
                  />
                  <input
                    name="reason"
                    placeholder="Reason"
                    style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 10px", width: 160 }}
                  />
                  <button className="secondary-button" type="submit" style={{ minHeight: 34, padding: "0 14px" }}>
                    Apply
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Recent Adjustments</h1>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Product</th>
            <th>Change</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((adj) => (
            <tr key={adj.id}>
              <td>{adj.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
              <td>{adj.product.title}</td>
              <td style={{ color: adj.delta < 0 ? "var(--rose)" : "var(--gold)", fontWeight: 800 }}>
                {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
              </td>
              <td>{adj.reason}</td>
            </tr>
          ))}
          {!recent.length ? (
            <tr>
              <td colSpan={4} style={{ color: "var(--muted)" }}>
                No adjustments yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
