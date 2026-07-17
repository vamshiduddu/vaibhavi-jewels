import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";
import {
  AreaChart,
  BarChart,
  CHART_COLORS,
  HBarChart,
  Sparkline,
} from "@/components/admin/charts";

const REVENUE_STATUSES = ["paid", "processing", "packed", "shipped", "delivered"] as const;

const DAY = 24 * 60 * 60 * 1000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function AdminDashboard() {
  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * DAY);
  const from60 = new Date(now.getTime() - 60 * DAY);

  const [
    orders30,
    prevOrders,
    statusGroups,
    revenueItems,
    lowStock,
    recentOrders,
    customerCount,
    newCustomers,
    activeProducts,
  ] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true, status: true, grandTotal: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: from60, lt: from30 } },
      select: { status: true, grandTotal: true },
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.orderItem.findMany({
      where: {
        order: { createdAt: { gte: from30 }, status: { in: [...REVENUE_STATUSES] } },
      },
      select: {
        title: true,
        lineTotal: true,
        quantity: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
    db.product.findMany({
      where: { status: "active", stockQuantity: { lte: 3 } },
      take: 8,
      orderBy: { stockQuantity: "asc" },
      select: { id: true, title: true, stockQuantity: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { items: { select: { quantity: true } } },
    }),
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: from30 } } }),
    db.product.count({ where: { status: "active" } }),
  ]);

  // daily series for the last 30 days
  const revenueByDay = new Map<string, number>();
  const ordersByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    revenueByDay.set(dayKey(d), 0);
    ordersByDay.set(dayKey(d), 0);
  }
  const isRevenue = (s: string) => (REVENUE_STATUSES as readonly string[]).includes(s);
  let revenue30 = 0;
  let paidOrders30 = 0;
  for (const order of orders30) {
    const key = dayKey(order.createdAt);
    if (ordersByDay.has(key)) ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    if (isRevenue(order.status)) {
      const amount = Number(order.grandTotal);
      revenue30 += amount;
      paidOrders30 += 1;
      if (revenueByDay.has(key)) revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + amount);
    }
  }
  const prevRevenue = prevOrders
    .filter((o) => isRevenue(o.status))
    .reduce((sum, o) => sum + Number(o.grandTotal), 0);
  const prevOrderCount = prevOrders.length;

  const revenueSeries = Array.from(revenueByDay.entries()).map(([key, value]) => ({
    label: dayLabel(new Date(key)),
    value: Math.round(value),
  }));
  const orderSeries = Array.from(ordersByDay.entries()).map(([key, value]) => ({
    label: dayLabel(new Date(key)),
    value,
  }));

  // status breakdown, pipeline order
  const STATUS_ORDER = [
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
  const STATUS_COLOR: Record<string, string> = {
    pending: "#9c2434",
    payment_pending: "#9c2434",
    paid: "#0e8f7e",
    processing: "#b47a1d",
    packed: "#b47a1d",
    shipped: "#b47a1d",
    delivered: "#0e8f7e",
    cancelled: "#8b8178",
    refunded: "#8b8178",
  };
  const statusData = STATUS_ORDER.map((status) => ({
    label: status.replace(/_/g, " "),
    value: statusGroups.find((g) => g.status === status)?._count._all ?? 0,
  })).filter((d) => d.value > 0);
  const statusColors = STATUS_ORDER.filter(
    (s) => (statusGroups.find((g) => g.status === s)?._count._all ?? 0) > 0,
  ).map((s) => STATUS_COLOR[s]);

  // revenue by category + top products (last 30d, paid)
  const byCategory = new Map<string, number>();
  const byProduct = new Map<string, { revenue: number; units: number }>();
  for (const item of revenueItems) {
    const cat = item.product?.category?.name ?? "Uncategorised";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(item.lineTotal));
    const p = byProduct.get(item.title) ?? { revenue: 0, units: 0 };
    p.revenue += Number(item.lineTotal);
    p.units += item.quantity;
    byProduct.set(item.title, p);
  }
  const categoryData = Array.from(byCategory.entries())
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const topProducts = Array.from(byProduct.entries())
    .map(([title, v]) => ({ title, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const aov = paidOrders30 ? revenue30 / paidOrders30 : 0;
  const toFulfil = statusGroups
    .filter((g) => ["paid", "processing", "packed"].includes(g.status))
    .reduce((sum, g) => sum + g._count._all, 0);

  const revDelta = prevRevenue > 0 ? ((revenue30 - prevRevenue) / prevRevenue) * 100 : null;
  const orderDelta =
    prevOrderCount > 0 ? ((orders30.length - prevOrderCount) / prevOrderCount) * 100 : null;

  const revSpark = revenueSeries.slice(-14).map((d) => d.value);
  const orderSpark = orderSeries.slice(-14).map((d) => d.value);

  return (
    <>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <span className="pill">Last 30 days</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>Revenue</span>
          <strong>{formatINR(Math.round(revenue30))}</strong>
          <div className="stat-foot">
            {revDelta !== null ? (
              <span className={`stat-delta ${revDelta >= 0 ? "up" : "down"}`}>
                {revDelta >= 0 ? "▲" : "▼"} {Math.abs(revDelta).toFixed(0)}% vs prev 30d
              </span>
            ) : (
              <span className="stat-delta">first 30 days</span>
            )}
            <Sparkline data={revSpark} color={CHART_COLORS[0]} />
          </div>
        </div>
        <div className="stat-card">
          <span>Orders</span>
          <strong>{orders30.length}</strong>
          <div className="stat-foot">
            {orderDelta !== null ? (
              <span className={`stat-delta ${orderDelta >= 0 ? "up" : "down"}`}>
                {orderDelta >= 0 ? "▲" : "▼"} {Math.abs(orderDelta).toFixed(0)}% vs prev 30d
              </span>
            ) : (
              <span className="stat-delta">first 30 days</span>
            )}
            <Sparkline data={orderSpark} color={CHART_COLORS[1]} />
          </div>
        </div>
        <div className="stat-card">
          <span>Avg Order Value</span>
          <strong>{formatINR(Math.round(aov))}</strong>
          <div className="stat-foot">
            <span className="stat-delta">{paidOrders30} paid orders</span>
          </div>
        </div>
        <div className="stat-card">
          <span>To Fulfil</span>
          <strong>{toFulfil}</strong>
          <div className="stat-foot">
            <span className="stat-delta">
              {customerCount} customers · {newCustomers} new · {activeProducts} live products
            </span>
          </div>
        </div>
      </div>

      <div className="dash-row dash-row-2-1">
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Revenue Trend</h3>
            <span>paid orders, daily</span>
          </div>
          <AreaChart data={revenueSeries} color={CHART_COLORS[0]} currency />
        </div>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Order Status</h3>
            <span>all time</span>
          </div>
          <HBarChart data={statusData} colors={statusColors} />
        </div>
      </div>

      <div className="dash-row dash-row-2-1">
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Orders Per Day</h3>
            <span>all statuses</span>
          </div>
          <BarChart data={orderSeries} color={CHART_COLORS[1]} />
        </div>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Revenue by Category</h3>
            <span>last 30 days</span>
          </div>
          <HBarChart data={categoryData} color={CHART_COLORS[2]} currency />
        </div>
      </div>

      <div className="dash-row dash-row-1-1">
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Top Products</h3>
            <span>by revenue, last 30 days</span>
          </div>
          {topProducts.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.title}>
                    <td>{p.title}</td>
                    <td>{p.units}</td>
                    <td>{formatINR(Math.round(p.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="chart-empty">No paid sales in the last 30 days yet.</p>
          )}
        </div>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Low Stock</h3>
            <Link href="/admin/inventory">Manage →</Link>
          </div>
          {lowStock.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Left</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link
                        href={`/admin/products/${product.id}`}
                        style={{ color: "var(--maroon)", fontWeight: 700 }}
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className="pill"
                        style={
                          product.stockQuantity < 1
                            ? { background: "rgba(156,36,52,0.12)", color: "#9c2434" }
                            : undefined
                        }
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="chart-empty">All products comfortably stocked.</p>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-head">
          <h3>Recent Orders</h3>
          <Link href="/admin/orders">View all →</Link>
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
                  <Link
                    href={`/admin/orders/${order.id}`}
                    style={{ color: "var(--maroon)", fontWeight: 700 }}
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td>
                  {order.customerName}
                  <br />
                  <small style={{ color: "var(--muted)" }}>{order.phone}</small>
                </td>
                <td>{order.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td>{formatINR(order.grandTotal)}</td>
                <td>
                  <span className={`status-pill ${order.status}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
            ))}
            {!recentOrders.length ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--muted)" }}>
                  No orders yet — they will appear here the moment one is placed.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
