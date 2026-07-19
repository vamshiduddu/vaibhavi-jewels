"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

type Props = {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  logoutAction: () => Promise<void>;
};

export default function AdminSidebar({ nav, userName, roleLabel, logoutAction }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-mobile-toggle admin-mobile-toggle-left"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="admin-mobile-brand">
          <strong>Vaibhavi Admin</strong>
          <span>
            {userName} · {roleLabel}
          </span>
        </div>

        <div className="admin-mobile-spacer" aria-hidden="true" />
      </div>

      {open ? (
        <button
          type="button"
          className="admin-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside className={`admin-sidebar${open ? " is-open" : ""}`}>
        <div className="admin-brand">Vaibhavi Admin</div>
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
              {item.label}
            </Link>
          );
        })}
        <div className="sidebar-footer">
          <div style={{ marginBottom: 8 }}>
            {userName} · {roleLabel}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 6,
                color: "inherit",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 14px",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
