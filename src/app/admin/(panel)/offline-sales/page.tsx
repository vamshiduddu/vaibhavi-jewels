import { createOfflineSale } from "@/lib/admin/operations-actions";
import { saleSummaryText } from "@/lib/admin/meta";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminOfflineSalesPage() {
  await requireAdmin("offline-sales");
  const [products, sales] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, sku: true, barcodeValue: true, stockQuantity: true },
    }),
    db.offlineSale.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { items: true, createdBy: true },
    }),
  ]);

  return (
    <>
      <div className="admin-header">
        <h1>Offline Sales</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Quick Counter Sale</h3>
          <form action={createOfflineSale} className="admin-form">
            <label>
              Product
              <select name="productId" required>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} · {product.stockQuantity} in stock
                    {product.barcodeValue ? ` · ${product.barcodeValue}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row-2">
              <label>
                Quantity
                <input name="quantity" type="number" min="1" defaultValue={1} required />
              </label>
              <label>
                Payment Method
                <select name="paymentMethod" defaultValue="cash">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="split_payment">Split payment</option>
                  <option value="credit_pending">Credit pending</option>
                </select>
              </label>
            </div>
            <div className="form-row-2">
              <label>
                Customer Name
                <input name="customerName" />
              </label>
              <label>
                Phone
                <input name="phone" />
              </label>
            </div>
            <label>
              Extra Discount (Rs.)
              <input name="discountTotal" type="number" min="0" step="0.01" defaultValue={0} />
            </label>
            <label>
              Notes
              <textarea name="notes" />
            </label>
            <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
              Record Offline Sale
            </button>
          </form>
        </section>

        <section className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recent Offline Sales</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sale</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    {sale.saleNumber}
                    <br />
                    <small style={{ color: "var(--muted)" }}>
                      {sale.createdAt.toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </small>
                  </td>
                  <td>
                    {sale.customerName || "Walk-in customer"}
                    <br />
                    <small style={{ color: "var(--muted)" }}>
                      {saleSummaryText(Number(sale.grandTotal), sale.items.reduce((sum, item) => sum + item.quantity, 0))}
                    </small>
                  </td>
                  <td>Rs. {Number(sale.grandTotal).toFixed(2)}</td>
                  <td>
                    <span className="pill">{sale.paymentMethod.replace(/_/g, " ")}</span>
                  </td>
                  <td>{sale.createdBy?.name ?? "System"}</td>
                </tr>
              ))}
              {!sales.length ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--muted)" }}>
                    No offline sales recorded yet.
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
