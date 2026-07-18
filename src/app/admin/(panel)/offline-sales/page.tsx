import Link from "next/link";
import ProductLookupField from "@/components/admin/ProductLookupField";
import { createOfflineSale, createSocialMediaSale } from "@/lib/admin/operations-actions";
import { saleSummaryText } from "@/lib/admin/meta";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR, toNumber } from "@/lib/format";

type SearchParams = Promise<{
  tab?: string;
}>;

export default async function AdminD2CSalesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin("offline-sales");
  const params = await searchParams;
  const activeTab = params.tab === "social" ? "social" : "offline";

  const [products, sales, socialOrders] = await Promise.all([
    db.product.findMany({
      where: { status: "active" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, sku: true, barcodeValue: true, stockQuantity: true },
    }),
    db.offlineSale.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: true, createdBy: true },
    }),
    db.order.findMany({
      where: { source: { in: ["manual_admin", "whatsapp_order"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { quantity: true } } },
    }),
  ]);

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>D2C Sales</h1>
          <p className="admin-header-note">
            Run counter billing and manual social orders from one place with shared inventory.
          </p>
        </div>
      </div>

      <div className="tab-strip" style={{ marginBottom: 20 }}>
        <Link
          href="/admin/offline-sales?tab=offline"
          className={activeTab === "offline" ? "tab-link active" : "tab-link"}
        >
          Offline POS
        </Link>
        <Link
          href="/admin/offline-sales?tab=social"
          className={activeTab === "social" ? "tab-link active" : "tab-link"}
        >
          Social Media Sales
        </Link>
      </div>

      {activeTab === "offline" ? (
        <div className="admin-two-col">
          <section className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>Quick Counter Sale</h3>
            <form action={createOfflineSale} className="admin-form">
              <ProductLookupField name="productId" label="Product Lookup" enableScanner />
              <details>
                <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>
                  Browse full product list
                </summary>
                <label style={{ marginTop: 10 }}>
                  Product
                  <select name="productId">
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title} · {product.stockQuantity} in stock
                        {product.barcodeValue ? ` · ${product.barcodeValue}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </details>
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
                Record POS Sale
              </button>
            </form>
          </section>

          <section className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recent POS Sales</h3>
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
                        {saleSummaryText(
                          Number(sale.grandTotal),
                          sale.items.reduce((sum, item) => sum + item.quantity, 0),
                        )}
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
                      No POS sales recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        <div className="admin-two-col">
          <section className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>Manual Social Media Order</h3>
            <form action={createSocialMediaSale} className="admin-form">
              <ProductLookupField name="productId" label="Product Lookup" enableScanner />
              <details>
                <summary style={{ cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>
                  Browse full product list
                </summary>
                <label style={{ marginTop: 10 }}>
                  Product
                  <select name="productId">
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title} · {product.stockQuantity} in stock
                        {product.sku ? ` · ${product.sku}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </details>
              <div className="form-row-2">
                <label>
                  Quantity
                  <input name="quantity" type="number" min="1" defaultValue={1} required />
                </label>
                <label>
                  Source
                  <select name="sourceType" defaultValue="whatsapp">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="form-row-2">
                <label>
                  Payment Status
                  <select name="paymentStatus" defaultValue="payment_pending">
                    <option value="paid">Paid</option>
                    <option value="payment_pending">Payment pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </label>
                <label>
                  Shipping (Rs.)
                  <input name="shippingTotal" type="number" min="0" step="0.01" defaultValue={0} />
                </label>
              </div>
              <div className="form-row-2">
                <label>
                  Discount (Rs.)
                  <input name="discountTotal" type="number" min="0" step="0.01" defaultValue={0} />
                </label>
                <label>
                  Customer Name
                  <input name="customerName" required />
                </label>
              </div>
              <div className="form-row-2">
                <label>
                  Phone
                  <input name="phone" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" />
                </label>
              </div>
              <label>
                Address Line 1
                <input name="line1" required />
              </label>
              <label>
                Address Line 2
                <input name="line2" />
              </label>
              <div className="form-row-2">
                <label>
                  City
                  <input name="city" required />
                </label>
                <label>
                  State
                  <input name="state" required />
                </label>
              </div>
              <div className="form-row-2">
                <label>
                  Pincode
                  <input name="pincode" required />
                </label>
                <label>
                  Country
                  <input name="country" defaultValue="India" required />
                </label>
              </div>
              <label>
                Notes
                <textarea name="notes" />
              </label>
              <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
                Create Social Order
              </button>
            </form>
          </section>

          <section className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recent Social Media Orders</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {socialOrders.map((order) => {
                  const source =
                    order.source === "whatsapp_order"
                      ? "WhatsApp"
                      : order.internalNotes?.match(/source=([^|]+)/)?.[1]?.trim() ?? "Manual";
                  return (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--maroon)", fontWeight: 700 }}>
                          {order.orderNumber}
                        </Link>
                        <br />
                        <small style={{ color: "var(--muted)" }}>
                          {order.createdAt.toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </small>
                      </td>
                      <td>
                        {order.customerName}
                        <br />
                        <small style={{ color: "var(--muted)" }}>{order.phone}</small>
                      </td>
                      <td>{source}</td>
                      <td>{formatINR(toNumber(order.grandTotal))}</td>
                      <td>
                        <span className={`status-pill ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
                      </td>
                    </tr>
                  );
                })}
                {!socialOrders.length ? (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--muted)" }}>
                      No social media sales recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}
