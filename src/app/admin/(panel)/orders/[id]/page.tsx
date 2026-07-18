import { notFound } from "next/navigation";
import OrderShipmentPanel from "@/components/admin/OrderShipmentPanel";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { saveOrderNotes, updateOrderStatus } from "@/lib/admin/order-actions";
import { getSettings } from "@/lib/content";
import { getReturnAddress, hasCompleteReturnAddress, toShippingLabel } from "@/lib/shipping-labels";

const STATUSES = [
  "pending",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: true,
        address: true,
        customer: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    }),
    getSettings(),
  ]);
  if (!order) notFound();
  const returnTo = getReturnAddress(settings);
  const shippingLabel = toShippingLabel(
    order,
    formatINR,
    order.payments[0]?.createdAt.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }) ?? "Paid",
    returnTo,
  );

  return (
    <>
      <div className="admin-header">
        <h1>{order.orderNumber}</h1>
        <span className={`status-pill ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
      </div>

      <div className="cart-layout">
        <div style={{ display: "grid", gap: 24 }}>
          <div className="admin-card">
            <h3 style={{ marginBottom: 16 }}>Items</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{formatINR(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatINR(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 16 }}>Payments</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Razorpay Order</th>
                  <th>Payment ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.provider}</td>
                    <td>{payment.razorpayOrderId ?? "—"}</td>
                    <td>{payment.razorpayPaymentId ?? "—"}</td>
                    <td>{formatINR(payment.amount)}</td>
                    <td>
                      <span className={`status-pill ${payment.status}`}>{payment.status}</span>
                    </td>
                  </tr>
                ))}
                {!order.payments.length ? (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--muted)" }}>
                      No payment records.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 16 }}>Internal Notes</h3>
            <form action={saveOrderNotes} className="admin-form">
              <input type="hidden" name="id" value={order.id} />
              <textarea name="internalNotes" defaultValue={order.internalNotes ?? ""} />
              <button className="secondary-button" type="submit" style={{ width: "fit-content" }}>
                Save Notes
              </button>
            </form>
          </div>
        </div>

        <aside style={{ display: "grid", gap: 24 }}>
          <div className="admin-card">
            <h3 style={{ marginBottom: 16 }}>Update Status</h3>
            <form action={updateOrderStatus} className="admin-form">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
                Update
              </button>
            </form>
          </div>

          <OrderShipmentPanel
            orderId={order.id}
            orderStatus={order.status}
            shippingPartner={order.shippingPartner}
            awbCode={order.awbCode}
            shippingCode={order.shippingCode}
            label={shippingLabel}
            returnAddressReady={hasCompleteReturnAddress(returnTo)}
          />

          <div className="admin-card">
            <h3 style={{ marginBottom: 16 }}>Customer</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.8, margin: 0 }}>
              {order.customerName}
              <br />
              {order.phone}
              {order.email ? (
                <>
                  <br />
                  {order.email}
                </>
              ) : null}
            </p>
          </div>

          {order.address ? (
            <div className="admin-card">
              <h3 style={{ marginBottom: 16 }}>Shipping Address</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.8, margin: 0 }}>
                {order.address.name}
                <br />
                {order.address.line1}
                {order.address.line2 ? (
                  <>
                    <br />
                    {order.address.line2}
                  </>
                ) : null}
                <br />
                {order.address.city}, {order.address.state} {order.address.pincode}
                <br />
                {order.address.phone}
              </p>
            </div>
          ) : null}

          <div className="admin-card">
            <h3 style={{ marginBottom: 16 }}>Totals</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>−{formatINR(order.discountTotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{formatINR(order.shippingTotal)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatINR(order.grandTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
