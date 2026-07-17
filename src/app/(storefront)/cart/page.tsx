import Link from "next/link";
import type { Metadata } from "next";
import { getCartDetail } from "@/lib/cart";
import { applyCoupon, removeCoupon } from "@/lib/cart-actions";
import { formatINR } from "@/lib/format";
import CartLineControls from "@/components/CartLineControls";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await getCartDetail();

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-kicker">Your bag</p>
        <h2>Shopping Cart</h2>
      </div>

      {!cart.lines.length ? (
        <div className="empty-collection">
          <strong>Your cart is empty.</strong>
          <span>Browse our collections and add pieces you love.</span>
          <Link className="primary-button" href="/collections" style={{ width: "fit-content" }}>
            View Collections
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {cart.lines.map((line) => (
              <div key={line.id} className="cart-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.imageUrl ?? "/vaibhavi-logo.png"} alt={line.title} />
                <div>
                  <h3>
                    <Link href={`/products/${line.slug}`}>{line.title}</Link>
                  </h3>
                  <p className="line-price">
                    {formatINR(line.unitPrice)}
                    {line.compareAt ? (
                      <>
                        {" "}
                        <span style={{ textDecoration: "line-through" }}>
                          {formatINR(line.compareAt)}
                        </span>
                      </>
                    ) : null}
                    {" · "}
                    {formatINR(line.lineTotal)} total
                  </p>
                  <CartLineControls
                    itemId={line.id}
                    quantity={line.quantity}
                    max={line.stockQuantity}
                  />
                </div>
              </div>
            ))}
          </div>

          <aside className="summary-card">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(cart.subtotal)}</span>
            </div>
            {cart.couponDiscount > 0 ? (
              <div className="summary-row">
                <span>
                  Coupon {cart.couponCode}{" "}
                  <form action={removeCoupon} style={{ display: "inline" }}>
                    <button className="remove-button" type="submit">
                      remove
                    </button>
                  </form>
                </span>
                <span className="discount">−{formatINR(cart.couponDiscount)}</span>
              </div>
            ) : null}
            <div className="summary-row">
              <span>Shipping</span>
              <span>{cart.shipping === 0 ? "Free" : formatINR(cart.shipping)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatINR(cart.grandTotal)}</span>
            </div>

            {cart.couponError ? <p className="form-error">{cart.couponError}</p> : null}
            {!cart.couponCode || cart.couponError ? (
              <form action={applyCoupon} className="coupon-row">
                <input name="code" placeholder="Coupon code" defaultValue={cart.couponError ? cart.couponCode ?? "" : ""} />
                <button className="secondary-button" type="submit">
                  Apply
                </button>
              </form>
            ) : null}

            <Link className="primary-button" href="/checkout">
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
