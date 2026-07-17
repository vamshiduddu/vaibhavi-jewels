import Link from "next/link";

export default function NotFound() {
  return (
    <div className="admin-login">
      <div className="admin-login-card" style={{ textAlign: "center" }}>
        <h1>Page not found</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link className="primary-button" href="/">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
