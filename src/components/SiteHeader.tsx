import Link from "next/link";
import Image from "next/image";
import { getCartDetail } from "@/lib/cart";
import { getActiveCategories, getActiveCollections } from "@/lib/catalog";
import { getSection, getSettings } from "@/lib/content";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "@/components/icons";

export default async function SiteHeader() {
  const [settings, announcement, cart, categories, collections] = await Promise.all([
    getSettings(),
    getSection("announcement"),
    getCartDetail(),
    getActiveCategories(),
    getActiveCollections(),
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
            <div className="nav-item nav-item-has-panel">
              <Link href="/collections">Collections</Link>
              {collections.length ? (
                <div className="nav-panel">
                  {collections.map((collection) => (
                    <Link key={collection.id} href={`/collections/${collection.slug}`}>
                      {collection.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="nav-item nav-item-has-panel">
              <Link href="/categories">Categories</Link>
              {categories.length ? (
                <div className="nav-panel nav-panel-categories">
                  {categories.map((category) => (
                    <div key={category.id} className="nav-panel-group">
                      <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                      {category.subcategories.slice(0, 6).map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={`/categories/${category.slug}/${subcategory.slug}`}
                          className="nav-panel-sub"
                        >
                          {subcategory.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <Link href="/#catalog">Shop All</Link>
            <Link href="/account/orders">Track Order</Link>
            <Link href="/#visit">Contact</Link>
          </nav>
        </div>
      </header>
    </>
  );
}
