import Link from "next/link";
import type { Metadata } from "next";
import { getCartDetail } from "@/lib/cart";
import { onlinePaymentsEnabled } from "@/lib/content";
import { formatINR } from "@/lib/format";
import { getShippingConfig } from "@/lib/pricing";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [cart, onlinePayments, shippingConfig] = await Promise.all([
    getCartDetail(),
    onlinePaymentsEnabled(),
    getShippingConfig(),
  ]);

  if (!cart.lines.length) {
    return (
      <section className="page-section">
        <div className="empty-collection">
          <strong>Your cart is empty.</strong>
          <span>Add pieces to your cart before checking out.</span>
          <Link className="primary-button" href="/collections" style={{ width: "fit-content" }}>
            View Collections
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-kicker">Secure checkout</p>
        <h2>Shipping Details</h2>
      </div>
      <div className="cart-layout">
        <div className="admin-card">
          <CheckoutForm onlinePayments={onlinePayments} countries={shippingConfig.supportedCountries} />
        </div>
        <aside className="summary-card">
          <h2>Order Summary</h2>
          {cart.lines.map((line) => (
            <div key={line.id} className="summary-row">
              <span>
                {line.title} × {line.quantity}
              </span>
              <span>{formatINR(line.lineTotal)}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatINR(cart.subtotal)}</span>
          </div>
          {cart.couponDiscount > 0 ? (
            <div className="summary-row">
              <span>Coupon {cart.couponCode}</span>
              <span className="discount">−{formatINR(cart.couponDiscount)}</span>
            </div>
          ) : null}
          <div className="summary-row">
            <span>Shipping</span>
            <span>{cart.shipping === 0 ? "Free" : formatINR(cart.shipping)}</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>
            Shipping shown here uses the default India estimate. Final shipping is recalculated from destination country and total product weight during order placement.
          </p>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatINR(cart.grandTotal)}</span>
          </div>
          <Link href="/cart" style={{ color: "var(--maroon)", fontSize: 14, fontWeight: 800 }}>
            ← Edit cart
          </Link>
        </aside>
      </div>
    </section>
  );
}
