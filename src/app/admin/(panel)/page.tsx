import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR, toNumber } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";
import {
  AreaChart,
  BarChart,
  CHART_COLORS,
  HBarChart,
  Sparkline,
} from "@/components/admin/charts";

const REVENUE_STATUSES = ["paid", "processing", "packed", "shipped", "delivered"] as const;
const FULFILMENT_STATUSES = [
  "pending",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "shipped",
] as const;
const ONLINE_ORDER_SOURCES = ["online_store"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

type DashboardSearchParams = Promise<{
  range?: string;
  from?: string;
  to?: string;
}>;

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function parseDateInput(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayKey(date: Date): string {
  return toDateInputValue(date);
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function percentDelta(current: number, previous: number): number | null {
  if (!previous) return current ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function buildDateRange(
  requestedRange: string | undefined,
  requestedFrom: string | undefined,
  requestedTo: string | undefined,
  now: Date,
) {
  const today = endOfDay(now);
  const range = requestedRange === "7d" || requestedRange === "30d" || requestedRange === "365d" || requestedRange === "custom"
    ? requestedRange
    : "30d";

  if (range === "custom") {
    const parsedFrom = parseDateInput(requestedFrom);
    const parsedTo = parseDateInput(requestedTo);
    if (parsedFrom && parsedTo) {
      const fromDate = startOfDay(parsedFrom <= parsedTo ? parsedFrom : parsedTo);
      const toDate = endOfDay(parsedFrom <= parsedTo ? parsedTo : parsedFrom);
      const spanDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime() + 1) / DAY_MS));
      const previousTo = endOfDay(shiftDays(fromDate, -1));
      const previousFrom = startOfDay(shiftDays(previousTo, -(spanDays - 1)));
      return {
        range,
        label: `${dayLabel(fromDate)} to ${dayLabel(toDate)}`,
        fromDate,
        toDate,
        previousFrom,
        previousTo,
      };
    }
  }

  const presetDays = range === "7d" ? 7 : range === "365d" ? 365 : 30;
  const fromDate = startOfDay(shiftDays(today, -(presetDays - 1)));
  const previousTo = endOfDay(shiftDays(fromDate, -1));
  const previousFrom = startOfDay(shiftDays(previousTo, -(presetDays - 1)));

  return {
    range,
    label: range === "7d" ? "Last 7 days" : range === "365d" ? "Last 365 days" : "Last 30 days",
    fromDate,
    toDate: today,
    previousFrom,
    previousTo,
  };
}

function sumTotals<T>(items: T[], getValue: (item: T) => number): number {
  return items.reduce((total, item) => total + getValue(item), 0);
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  await requireAdmin("reports");

  const params = await searchParams;
  const now = new Date();
  const rangeConfig = buildDateRange(params.range, params.from, params.to, now);
  const rangeWhere = {
    gte: rangeConfig.fromDate,
    lte: rangeConfig.toDate,
  };
  const previousWhere = {
    gte: rangeConfig.previousFrom,
    lte: rangeConfig.previousTo,
  };

  const [
    ordersInRange,
    previousOrders,
    allOrders,
    statusGroups,
    offlineSalesInRange,
    previousOfflineSales,
    allOfflineSales,
    revenueItems,
    offlineRevenueItems,
    lowStock,
    recentOrders,
    customerCount,
    newCustomers,
    activeProducts,
  ] = await Promise.all([
    db.order.findMany({
      where: { createdAt: rangeWhere },
      select: { createdAt: true, status: true, grandTotal: true, source: true },
    }),
    db.order.findMany({
      where: { createdAt: previousWhere },
      select: { status: true, grandTotal: true, source: true },
    }),
    db.order.findMany({
      select: { status: true, grandTotal: true, source: true },
    }),
    db.order.groupBy({ by: ["status"], where: { createdAt: rangeWhere }, _count: { _all: true } }),
    db.offlineSale.findMany({
      where: { createdAt: rangeWhere },
      select: { createdAt: true, grandTotal: true },
    }),
    db.offlineSale.findMany({
      where: { createdAt: previousWhere },
      select: { grandTotal: true },
    }),
    db.offlineSale.findMany({
      select: { grandTotal: true },
    }),
    db.orderItem.findMany({
      where: {
        order: {
          createdAt: rangeWhere,
          status: { in: [...REVENUE_STATUSES] },
        },
      },
      select: {
        title: true,
        lineTotal: true,
        quantity: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
    db.offlineSaleItem.findMany({
      where: {
        offlineSale: {
          createdAt: rangeWhere,
        },
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
      where: { createdAt: rangeWhere },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: { items: { select: { quantity: true } } },
    }),
    db.customer.count(),
    db.customer.count({ where: { createdAt: rangeWhere } }),
    db.product.count({ where: { status: "active" } }),
  ]);

  const revenueStatusSet = new Set<string>(REVENUE_STATUSES);
  const fulfilmentStatusSet = new Set<string>(FULFILMENT_STATUSES);
  const onlineSourceSet = new Set<string>(ONLINE_ORDER_SOURCES);

  const selectedOnlineRevenue = sumTotals(
    ordersInRange.filter((order) => revenueStatusSet.has(order.status) && onlineSourceSet.has(order.source)),
    (order) => toNumber(order.grandTotal),
  );
  const selectedD2cRevenue =
    sumTotals(
      ordersInRange.filter((order) => revenueStatusSet.has(order.status) && !onlineSourceSet.has(order.source)),
      (order) => toNumber(order.grandTotal),
    ) + sumTotals(offlineSalesInRange, (sale) => toNumber(sale.grandTotal));
  const previousOnlineRevenue = sumTotals(
    previousOrders.filter((order) => revenueStatusSet.has(order.status) && onlineSourceSet.has(order.source)),
    (order) => toNumber(order.grandTotal),
  );
  const previousD2cRevenue =
    sumTotals(
      previousOrders.filter((order) => revenueStatusSet.has(order.status) && !onlineSourceSet.has(order.source)),
      (order) => toNumber(order.grandTotal),
    ) + sumTotals(previousOfflineSales, (sale) => toNumber(sale.grandTotal));

  const selectedOnlineOrders = ordersInRange.filter((order) => onlineSourceSet.has(order.source)).length;
  const selectedD2cOrders =
    ordersInRange.filter((order) => !onlineSourceSet.has(order.source)).length + offlineSalesInRange.length;
  const previousOnlineOrders = previousOrders.filter((order) => onlineSourceSet.has(order.source)).length;
  const previousD2cOrders =
    previousOrders.filter((order) => !onlineSourceSet.has(order.source)).length + previousOfflineSales.length;

  const allOnlineRevenue = sumTotals(
    allOrders.filter((order) => revenueStatusSet.has(order.status) && onlineSourceSet.has(order.source)),
    (order) => toNumber(order.grandTotal),
  );
  const allD2cRevenue =
    sumTotals(
      allOrders.filter((order) => revenueStatusSet.has(order.status) && !onlineSourceSet.has(order.source)),
      (order) => toNumber(order.grandTotal),
    ) + sumTotals(allOfflineSales, (sale) => toNumber(sale.grandTotal));
  const allOnlineOrders = allOrders.filter((order) => onlineSourceSet.has(order.source)).length;
  const allD2cOrders = allOrders.filter((order) => !onlineSourceSet.has(order.source)).length + allOfflineSales.length;

  const selectedCombinedRevenue = selectedOnlineRevenue + selectedD2cRevenue;
  const previousCombinedRevenue = previousOnlineRevenue + previousD2cRevenue;
  const allCombinedRevenue = allOnlineRevenue + allD2cRevenue;
  const selectedCombinedOrders = selectedOnlineOrders + selectedD2cOrders;
  const previousCombinedOrders = previousOnlineOrders + previousD2cOrders;
  const allCombinedOrders = allOnlineOrders + allD2cOrders;
  const selectedAverageOrderValue = selectedCombinedOrders
    ? selectedCombinedRevenue / selectedCombinedOrders
    : 0;

  const toFulfil = ordersInRange.filter((order) => fulfilmentStatusSet.has(order.status)).length;

  const revenueByDay = new Map<string, number>();
  const ordersByDay = new Map<string, number>();
  for (
    let cursor = startOfDay(rangeConfig.fromDate);
    cursor <= rangeConfig.toDate;
    cursor = shiftDays(cursor, 1)
  ) {
    const key = dayKey(cursor);
    revenueByDay.set(key, 0);
    ordersByDay.set(key, 0);
  }

  for (const order of ordersInRange) {
    const key = dayKey(order.createdAt);
    ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    if (revenueStatusSet.has(order.status)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + toNumber(order.grandTotal));
    }
  }
  for (const sale of offlineSalesInRange) {
    const key = dayKey(sale.createdAt);
    ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + toNumber(sale.grandTotal));
  }

  const revenueSeries = Array.from(revenueByDay.entries()).map(([key, value]) => ({
    label: dayLabel(new Date(`${key}T00:00:00`)),
    value: Math.round(value),
  }));
  const orderSeries = Array.from(ordersByDay.entries()).map(([key, value]) => ({
    label: dayLabel(new Date(`${key}T00:00:00`)),
    value,
  }));

  const statusOrder = [
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
  const statusColor: Record<string, string> = {
    pending: "#9c2434",
    payment_pending: "#9c2434",
    paid: "#0e8f7e",
    processing: "#b47a1d",
    packed: "#b47a1d",
    shipped: "#5865c0",
    delivered: "#0e8f7e",
    cancelled: "#8b8178",
    refunded: "#8b8178",
  };
  const statusData = statusOrder
    .map((status) => ({
      label: status.replace(/_/g, " "),
      value: statusGroups.find((group) => group.status === status)?._count._all ?? 0,
    }))
    .filter((entry) => entry.value > 0);
  const statusColors = statusOrder
    .filter((status) => (statusGroups.find((group) => group.status === status)?._count._all ?? 0) > 0)
    .map((status) => statusColor[status]);

  const categoryRevenue = new Map<string, number>();
  const productRevenue = new Map<string, { revenue: number; units: number }>();
  for (const item of [...revenueItems, ...offlineRevenueItems]) {
    const category = item.product?.category?.name ?? "Uncategorised";
    categoryRevenue.set(category, (categoryRevenue.get(category) ?? 0) + toNumber(item.lineTotal));
    const current = productRevenue.get(item.title) ?? { revenue: 0, units: 0 };
    current.revenue += toNumber(item.lineTotal);
    current.units += item.quantity;
    productRevenue.set(item.title, current);
  }

  const categoryData = Array.from(categoryRevenue.entries())
    .map(([label, value]) => ({ label, value: Math.round(value) }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8);
  const topProducts = Array.from(productRevenue.entries())
    .map(([title, value]) => ({ title, ...value }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 6);

  const revenueDelta = percentDelta(selectedCombinedRevenue, previousCombinedRevenue);
  const ordersDelta = percentDelta(selectedCombinedOrders, previousCombinedOrders);
  const revenueSpark = revenueSeries.slice(-Math.min(revenueSeries.length, 14)).map((point) => point.value);
  const orderSpark = orderSeries.slice(-Math.min(orderSeries.length, 14)).map((point) => point.value);

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p className="admin-header-note">
            Revenue and orders for {rangeConfig.label.toLowerCase()} with source-aware D2C vs online totals.
          </p>
        </div>
        <form method="get" className="dashboard-filters">
          <div className="dashboard-filters-row">
            <label>
              Range
              <select name="range" defaultValue={rangeConfig.range}>
                <option value="7d">Last week</option>
                <option value="30d">Last month</option>
                <option value="365d">Last year</option>
                <option value="custom">Custom dates</option>
              </select>
            </label>
            <label>
              From
              <input
                type="date"
                name="from"
                defaultValue={toDateInputValue(rangeConfig.fromDate)}
                max={toDateInputValue(now)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                name="to"
                defaultValue={toDateInputValue(rangeConfig.toDate)}
                max={toDateInputValue(now)}
              />
            </label>
          </div>
          <div className="dashboard-filters-actions">
            <button type="submit" className="primary-button">
              Apply
            </button>
            <Link href="/admin" className="secondary-button">
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>Combined Revenue</span>
          <strong>{formatINR(Math.round(selectedCombinedRevenue))}</strong>
          <div className="stat-foot">
            {revenueDelta !== null ? (
              <span className={`stat-delta ${revenueDelta >= 0 ? "up" : "down"}`}>
                {revenueDelta >= 0 ? "Up" : "Down"} {Math.abs(revenueDelta).toFixed(0)}% vs previous range
              </span>
            ) : (
              <span className="stat-delta">No previous range data</span>
            )}
            <Sparkline data={revenueSpark.length ? revenueSpark : [0]} color={CHART_COLORS[0]} />
          </div>
          <div className="stat-subline">All time {formatINR(Math.round(allCombinedRevenue))}</div>
        </div>

        <div className="stat-card">
          <span>Combined Orders</span>
          <strong>{selectedCombinedOrders}</strong>
          <div className="stat-foot">
            {ordersDelta !== null ? (
              <span className={`stat-delta ${ordersDelta >= 0 ? "up" : "down"}`}>
                {ordersDelta >= 0 ? "Up" : "Down"} {Math.abs(ordersDelta).toFixed(0)}% vs previous range
              </span>
            ) : (
              <span className="stat-delta">No previous range data</span>
            )}
            <Sparkline data={orderSpark.length ? orderSpark : [0]} color={CHART_COLORS[1]} />
          </div>
          <div className="stat-subline">All time {allCombinedOrders}</div>
        </div>

        <div className="stat-card">
          <span>Online Revenue</span>
          <strong>{formatINR(Math.round(selectedOnlineRevenue))}</strong>
          <div className="stat-foot">
            <span className="stat-delta">{selectedOnlineOrders} online orders in range</span>
          </div>
          <div className="stat-subline">All time {formatINR(Math.round(allOnlineRevenue))}</div>
        </div>

        <div className="stat-card">
          <span>D2C Revenue</span>
          <strong>{formatINR(Math.round(selectedD2cRevenue))}</strong>
          <div className="stat-foot">
            <span className="stat-delta">{selectedD2cOrders} D2C orders in range</span>
          </div>
          <div className="stat-subline">All time {formatINR(Math.round(allD2cRevenue))}</div>
        </div>

        <div className="stat-card">
          <span>Online Orders</span>
          <strong>{selectedOnlineOrders}</strong>
          <div className="stat-foot">
            <span className="stat-delta">All time {allOnlineOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <span>D2C Orders</span>
          <strong>{selectedD2cOrders}</strong>
          <div className="stat-foot">
            <span className="stat-delta">All time {allD2cOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <span>Avg Order Value</span>
          <strong>{formatINR(Math.round(selectedAverageOrderValue))}</strong>
          <div className="stat-foot">
            <span className="stat-delta">{selectedCombinedOrders} combined orders in range</span>
          </div>
        </div>

        <div className="stat-card">
          <span>To Fulfil</span>
          <strong>{toFulfil}</strong>
          <div className="stat-foot">
            <span className="stat-delta">
              Includes pending, payment pending, paid, processing, packed, and shipped orders in range
            </span>
          </div>
          <div className="stat-subline">
            {customerCount} customers total, {newCustomers} new in range, {activeProducts} live products
          </div>
        </div>
      </div>

      <div className="dash-row dash-row-2-1">
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Revenue Trend</h3>
            <span>online paid plus D2C sales</span>
          </div>
          <AreaChart data={revenueSeries} color={CHART_COLORS[0]} currency />
        </div>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Order Status</h3>
            <span>{rangeConfig.label.toLowerCase()}</span>
          </div>
          <HBarChart data={statusData} colors={statusColors} />
        </div>
      </div>

      <div className="dash-row dash-row-2-1">
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Orders Per Day</h3>
            <span>online orders plus D2C sales</span>
          </div>
          <BarChart data={orderSeries} color={CHART_COLORS[1]} />
        </div>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Revenue by Category</h3>
            <span>{rangeConfig.label.toLowerCase()}</span>
          </div>
          <HBarChart data={categoryData} color={CHART_COLORS[2]} currency />
        </div>
      </div>

      <div className="dash-row dash-row-1-1">
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Top Products</h3>
            <span>combined online and D2C revenue</span>
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
                {topProducts.map((product) => (
                  <tr key={product.title}>
                    <td>{product.title}</td>
                    <td>{product.units}</td>
                    <td>{formatINR(Math.round(product.revenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="chart-empty">No sales found for the selected range.</p>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Low Stock</h3>
            <Link href="/admin/inventory">Manage</Link>
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
                      <Link href={`/admin/products/${product.id}`} style={{ color: "var(--maroon)", fontWeight: 700 }}>
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
            <p className="chart-empty">All active products are stocked above the low-stock threshold.</p>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-head">
          <h3>Recent Orders</h3>
          <span>{rangeConfig.label.toLowerCase()}</span>
          <Link href="/admin/orders">View all</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Source</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--maroon)", fontWeight: 700 }}>
                    {order.orderNumber}
                  </Link>
                </td>
                <td>
                  {order.customerName}
                  <br />
                  <small style={{ color: "var(--muted)" }}>{order.phone}</small>
                </td>
                <td>{order.items.reduce((count, item) => count + item.quantity, 0)}</td>
                <td>{order.source.replace(/_/g, " ")}</td>
                <td>{formatINR(order.grandTotal)}</td>
                <td>
                  <span className={`status-pill ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
                </td>
              </tr>
            ))}
            {!recentOrders.length ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
