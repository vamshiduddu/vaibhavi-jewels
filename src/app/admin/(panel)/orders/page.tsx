import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

const STATUS_FILTERS = [
  "all",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const filter = STATUS_FILTERS.includes(status as (typeof STATUS_FILTERS)[number])
    ? status
    : "all";

  const orders = await db.order.findMany({
    where: filter && filter !== "all" ? { status: filter as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Orders</h1>
      </div>
      <div className="subcategory-strip" style={{ justifyContent: "flex-start", marginBottom: 24 }}>
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={filter === s ? "active" : undefined}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                  {order.orderNumber}
                </Link>
              </td>
              <td>{order.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
              <td>
                {order.customerName}
                <br />
                <small style={{ color: "var(--muted)" }}>{order.phone}</small>
              </td>
              <td>{order.items.reduce((n, i) => n + i.quantity, 0)}</td>
              <td>{formatINR(order.grandTotal)}</td>
              <td>
                {order.payments[0] ? (
                  <span className={`status-pill ${order.payments[0].status}`}>
                    {order.payments[0].status}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <span className={`status-pill ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
              </td>
            </tr>
          ))}
          {!orders.length ? (
            <tr>
              <td colSpan={7} style={{ color: "var(--muted)" }}>
                No orders found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
