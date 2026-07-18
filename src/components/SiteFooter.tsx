import Link from "next/link";
import { getSettings } from "@/lib/content";

export default async function SiteFooter() {
  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <strong>About {settings.site_name ?? "Vaibhavi Jewels"}</strong>
          <span>
            {settings.footer_about ??
              "Elegant one gram jewellery curated for celebrations, gifting, and everyday shine."}
          </span>
        </div>
        <div>
          <strong>Quick Links</strong>
          <Link href="/collections">Collections</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/search">Search</Link>
        </div>
        <div>
          <strong>Help</strong>
          <Link href="/about-us">About Us</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms & Conditions</Link>
          <Link href="/shipping-and-delivery">Shipping & Delivery</Link>
          <Link href="/return-exchange">Return & Exchange</Link>
          <Link href="/maintenance">Maintenance</Link>
          <Link href="/account/orders">Track Order</Link>
          {settings.instagram_url ? (
            <a href={settings.instagram_url} target="_blank" rel="noreferrer">
              Instagram
            </a>
          ) : null}
          {settings.youtube_url ? (
            <a href={settings.youtube_url} target="_blank" rel="noreferrer">
              YouTube
            </a>
          ) : null}
        </div>
        <div>
          <strong>{settings.site_name ?? "Vaibhavi Jewels"}</strong>
          <span>
            &copy; {year} {settings.site_domain ?? "vaibhavijewels.in"}
          </span>
        </div>
      </div>
    </footer>
  );
}
