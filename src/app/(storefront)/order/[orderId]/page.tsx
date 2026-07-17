import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings, whatsappLink } from "@/lib/content";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();

  const settings = await getSettings();
  const phone = settings.whatsapp_phone ?? "918074486906";
  const paid = order.status !== "pending" && order.status !== "payment_pending" && order.status !== "cancelled";
  const manualPending = order.status === "pending" && order.payments.length === 0;

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-kicker">{manualPending ? "Order received!" : paid ? "Thank you!" : "Order status"}</p>
        <h2>Order {order.orderNumber}</h2>
        <p style={{ marginTop: 14 }}>
          <span className={`status-pill ${order.status}`}>{order.status.replace(/_/g, " ")}</span>
        </p>
      </div>

      {manualPending ? (
        <div className="form-success" style={{ marginBottom: 24, maxWidth: 720 }}>
          Your order is confirmed. We will message you on WhatsApp ({order.phone}) with payment
          details shortly — or reach us right away:{" "}
          <a
            href={whatsappLink(
              phone,
              `Hello Vaibhavi Jewels, I placed order ${order.orderNumber} and would like to complete the payment.`,
            )}
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 700, textDecoration: "underline" }}
          >
            Pay via WhatsApp
          </a>
        </div>
      ) : null}

      <div className="cart-layout">
        <div className="cart-lines">
          {order.items.map((item) => (
            <div key={item.id} className="cart-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl ?? "/vaibhavi-logo.png"} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p className="line-price">
                  {formatINR(item.unitPrice)} × {item.quantity} = {formatINR(item.lineTotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <aside className="summary-card">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          {Number(order.discountTotal) > 0 ? (
            <div className="summary-row">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span className="discount">−{formatINR(order.discountTotal)}</span>
            </div>
          ) : null}
          <div className="summary-row">
            <span>Shipping</span>
            <span>{Number(order.shippingTotal) === 0 ? "Free" : formatINR(order.shippingTotal)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatINR(order.grandTotal)}</span>
          </div>
          {order.address ? (
            <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
              <strong style={{ color: "var(--ink)" }}>Shipping to</strong>
              <br />
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
            </div>
          ) : null}
          <Link className="primary-button" href="/">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}
