import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function AdminDashboard() {
  const [productCount, activeProducts, orderCount, paidAggregate, pendingOrders, lowStock, recentOrders] =
    await Promise.all([
      db.product.count(),
      db.product.count({ where: { status: "active" } }),
      db.order.count(),
      db.order.aggregate({
        where: { status: { in: ["paid", "processing", "packed", "shipped", "delivered"] } },
        _sum: { grandTotal: true },
      }),
      db.order.count({ where: { status: { in: ["paid", "processing", "packed"] } } }),
      db.product.findMany({
        where: { status: "active", stockQuantity: { lte: 3 } },
        take: 8,
        orderBy: { stockQuantity: "asc" },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true },
      }),
    ]);

  return (
    <>
      <div className="admin-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <strong>{formatINR(paidAggregate._sum.grandTotal ?? 0)}</strong>
          <span>Paid revenue</span>
        </div>
        <div className="stat-card">
          <strong>{orderCount}</strong>
          <span>Total orders</span>
        </div>
        <div className="stat-card">
          <strong>{pendingOrders}</strong>
          <span>Orders to fulfil</span>
        </div>
        <div className="stat-card">
          <strong>
            {activeProducts}/{productCount}
          </strong>
          <span>Active products</span>
        </div>
      </div>

      <div className="admin-header">
        <h1 style={{ fontSize: 28 }}>Recent Orders</h1>
        <Link className="secondary-button" href="/admin/orders">
          View all
        </Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                  {order.orderNumber}
                </Link>
              </td>
              <td>
                {order.customerName}
                <br />
                <small style={{ color: "var(--muted)" }}>{order.phone}</small>
              </td>
              <td>{order.items.length}</td>
              <td>{formatINR(order.grandTotal)}</td>
              <td>
                <span className={`status-pill ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
              </td>
            </tr>
          ))}
          {!recentOrders.length ? (
            <tr>
              <td colSpan={5} style={{ color: "var(--muted)" }}>
                No orders yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {lowStock.length ? (
        <>
          <div className="admin-header" style={{ marginTop: 34 }}>
            <h1 style={{ fontSize: 28 }}>Low Stock</h1>
            <Link className="secondary-button" href="/admin/inventory">
              Manage inventory
            </Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/admin/products/${product.id}`} style={{ color: "var(--maroon)", fontWeight: 800 }}>
                      {product.title}
                    </Link>
                  </td>
                  <td>{product.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </>
  );
}
