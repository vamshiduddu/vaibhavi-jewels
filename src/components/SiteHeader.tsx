import Link from "next/link";
import Image from "next/image";
import { getCartDetail } from "@/lib/cart";
import { getSection, getSettings } from "@/lib/content";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "@/components/icons";

export default async function SiteHeader() {
  const [settings, announcement, cart] = await Promise.all([
    getSettings(),
    getSection("announcement"),
    getCartDetail(),
  ]);

  return (
    <>
      {announcement?.body ? <div className="announcement">{announcement.body}</div> : null}
      <header className="site-header">
        <div className="header-main">
          <Link className="brand" href="/" aria-label="Vaibhavi Jewels home">
            <Image
              className="brand-logo"
              src="/vaibhavi-logo.png"
              alt=""
              width={38}
              height={38}
            />
            <span>{settings.site_name ?? "Vaibhavi Jewels"}</span>
          </Link>

          <div className="header-search">
            <form action="/search" method="get" role="search">
              <input
                type="search"
                name="q"
                placeholder="Search earrings, necklace, antique..."
                aria-label="Search products"
              />
              <button type="submit" aria-label="Search">
                <SearchIcon />
              </button>
            </form>
          </div>

          <div className="header-icons">
            <Link className="icon-link" href="/account">
              <UserIcon />
              <span>Account</span>
            </Link>
            <Link className="icon-link" href="/wishlist">
              <HeartIcon />
              <span>Wishlist</span>
            </Link>
            <Link className="icon-link" href="/cart" aria-label={`Cart, ${cart.itemCount} items`}>
              <BagIcon />
              <span>Cart</span>
              {cart.itemCount ? <span className="cart-badge">{cart.itemCount}</span> : null}
            </Link>
          </div>
        </div>

        <div className="nav-strip">
          <nav aria-label="Main navigation">
            <Link href="/collections">Collections</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/#new-arrivals">New Arrivals</Link>
            <Link href="/#bridal">Bridal</Link>
            <Link href="/account/orders">Track Order</Link>
            <Link href="/#visit">Contact</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
