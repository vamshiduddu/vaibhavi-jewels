import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "My Orders" };

type Props = { searchParams: Promise<{ phone?: string; order?: string }> };

export default async function OrdersLookupPage({ searchParams }: Props) {
  const { phone, order: orderNo } = await searchParams;
  const cleanPhone = (phone ?? "").replace(/\D/g, "");

  const orders =
    cleanPhone.length >= 10
      ? await db.order.findMany({
          where: {
            phone: { contains: cleanPhone.slice(-10) },
            ...(orderNo ? { orderNumber: { contains: orderNo.toUpperCase() } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { items: true },
        })
      : [];

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-kicker">Order tracking</p>
        <h2>Find your orders.</h2>
      </div>

      <form method="get" className="coupon-row" style={{ maxWidth: 560, marginBottom: 34 }}>
        <input
          name="phone"
          placeholder="Phone number used at checkout"
          defaultValue={phone ?? ""}
          inputMode="tel"
          style={{ textTransform: "none" }}
        />
        <button className="primary-button" type="submit">
          Search
        </button>
      </form>

      {cleanPhone.length >= 10 && !orders.length ? (
        <div className="empty-collection">
          <strong>No orders found.</strong>
          <span>Check the phone number, or contact us on WhatsApp for help.</span>
        </div>
      ) : null}

      {orders.length ? (
        <div className="cart-lines" style={{ maxWidth: 760 }}>
          {orders.map((order) => (
            <Link key={order.id} href={`/order/${order.id}`} className="cart-line">
              <div style={{ gridColumn: "1 / -1" }}>
                <h3>{order.orderNumber}</h3>
                <p className="line-price">
                  {order.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })} ·{" "}
                  {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                  {formatINR(order.grandTotal)}{" "}
                  <span className={`status-pill ${order.status}`} style={{ marginLeft: 8 }}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
