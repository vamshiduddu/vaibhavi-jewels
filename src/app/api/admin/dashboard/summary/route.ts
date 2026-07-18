import { NextResponse } from "next/server";
import { getAdminSession, hasPermission } from "@/lib/auth";
import { db } from "@/lib/db";

const REVENUE_STATUSES = ["paid", "processing", "packed", "shipped", "delivered"] as const;
const DAY = 24 * 60 * 60 * 1000;

function isRevenueStatus(status: string) {
  return (REVENUE_STATUSES as readonly string[]).includes(status);
}

export async function GET() {
  const session = await getAdminSession();
  if (
    !session ||
    !hasPermission(session.role, "reports", {
      grantedPermissions: session.grantedPermissions,
      deniedPermissions: session.deniedPermissions,
    })
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * DAY);

  const [orders30, allOrders, offlineSales30, allOfflineSales, lowStock, customerCount, activeProducts] =
    await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: from30 } },
        select: { status: true, grandTotal: true },
      }),
      db.order.findMany({
        select: { status: true, grandTotal: true },
      }),
      db.offlineSale.findMany({
        where: { createdAt: { gte: from30 } },
        select: { grandTotal: true },
      }),
      db.offlineSale.findMany({
        select: { grandTotal: true },
      }),
      db.product.findMany({
        where: { status: "active", stockQuantity: { lte: 3 } },
        take: 8,
        orderBy: { stockQuantity: "asc" },
        select: { id: true, title: true, stockQuantity: true },
      }),
      db.customer.count(),
      db.product.count({ where: { status: "active" } }),
    ]);

  const onlineRevenue30 = orders30
    .filter((order) => isRevenueStatus(order.status))
    .reduce((sum, order) => sum + Number(order.grandTotal), 0);
  const onlineRevenueAllTime = allOrders
    .filter((order) => isRevenueStatus(order.status))
    .reduce((sum, order) => sum + Number(order.grandTotal), 0);
  const offlineRevenue30 = offlineSales30.reduce((sum, sale) => sum + Number(sale.grandTotal), 0);
  const offlineRevenueAllTime = allOfflineSales.reduce(
    (sum, sale) => sum + Number(sale.grandTotal),
    0,
  );

  return NextResponse.json({
    last30Days: {
      revenue: {
        online: onlineRevenue30,
        offline: offlineRevenue30,
        combined: onlineRevenue30 + offlineRevenue30,
      },
      orders: {
        online: orders30.length,
        offline: offlineSales30.length,
        combined: orders30.length + offlineSales30.length,
      },
    },
    allTime: {
      revenue: {
        online: onlineRevenueAllTime,
        offline: offlineRevenueAllTime,
        combined: onlineRevenueAllTime + offlineRevenueAllTime,
      },
      orders: {
        online: allOrders.length,
        offline: allOfflineSales.length,
        combined: allOrders.length + allOfflineSales.length,
      },
    },
    customerCount,
    activeProducts,
    lowStock,
  });
}
