import Link from "next/link";

export default function EmptyCatalogNote({ label }: { label: string }) {
  return (
    <div className="empty-collection">
      <strong>{label} pieces are coming soon.</strong>
      <span>
        New designs are being photographed and uploaded. Meanwhile, browse other categories or
        message us on WhatsApp for the latest pieces.
      </span>
      <Link className="primary-button" href="/categories" style={{ width: "fit-content" }}>
        Browse Categories
      </Link>
    </div>
  );
}
