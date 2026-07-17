import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings, whatsappLink } from "@/lib/content";
import { getWishlistSessionId } from "@/lib/wishlist-actions";
import { getCartDetail } from "@/lib/cart";
import { BagIcon, ChatIcon, HeartIcon, PackageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const [settings, cart, wishlistSessionId] = await Promise.all([
    getSettings(),
    getCartDetail(),
    getWishlistSessionId(),
  ]);
  const wishlistCount = wishlistSessionId
    ? await db.wishlistItem.count({ where: { sessionId: wishlistSessionId } })
    : 0;
  const phone = settings.whatsapp_phone ?? "918074486906";

  return (
    <>
      <section className="category-hero">
        <h1>My Account</h1>
        <p>No passwords, no sign-ups — track everything with the phone number you order with.</p>
      </section>
      <section className="page-section" style={{ paddingTop: 28 }}>
        <div className="account-grid">
          <Link className="account-card" href="/account/orders">
            <PackageIcon />
            <strong>My Orders</strong>
            <span>Find your orders and delivery status using your phone number.</span>
          </Link>
          <Link className="account-card" href="/wishlist">
            <HeartIcon />
            <strong>Wishlist</strong>
            <span>
              {wishlistCount
                ? `${wishlistCount} piece${wishlistCount === 1 ? "" : "s"} saved for later.`
                : "Pieces you save appear here."}
            </span>
          </Link>
          <Link className="account-card" href="/cart">
            <BagIcon />
            <strong>My Cart</strong>
            <span>
              {cart.itemCount
                ? `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"} waiting in your cart.`
                : "Your cart is empty — explore the collections."}
            </span>
          </Link>
          <a
            className="account-card"
            href={whatsappLink(phone, "Hello Vaibhavi Jewels, I need help with my order.")}
            target="_blank"
            rel="noreferrer"
          >
            <ChatIcon />
            <strong>WhatsApp Support</strong>
            <span>Order help, video call assistance, and styling advice on WhatsApp.</span>
          </a>
        </div>
      </section>
    </>
  );
}
