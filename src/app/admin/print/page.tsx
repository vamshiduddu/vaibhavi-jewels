"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const IOS_PRINT_STORAGE_KEY = "vaibhavi-admin-print";

type PrintPayload = {
  css: string;
  html: string;
  title: string;
  variant: "barcode" | "shipping";
  ts: number;
};

export default function AdminPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant");
  const [payload, setPayload] = useState<PrintPayload | null>(null);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(IOS_PRINT_STORAGE_KEY);
    if (!raw) {
      setPayload(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PrintPayload;
      setPayload(parsed);
      if (parsed.title) document.title = parsed.title;
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    if (!payload || attempted) return;
    setAttempted(true);
    const id = window.setTimeout(() => {
      window.print();
    }, 260);
    return () => window.clearTimeout(id);
  }, [attempted, payload]);

  const helpText = useMemo(() => {
    if (variant === "shipping") return "If the print sheet does not open automatically, tap Print Labels below.";
    return "If the barcode print sheet does not open automatically, tap Print Labels below.";
  }, [variant]);

  return (
    <div style={{ background: "#f5efe5", minHeight: "100vh" }}>
      <div
        style={{
          alignItems: "center",
          background: "#6f0d19",
          color: "#fff3dd",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            color: "inherit",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.05em",
            padding: "9px 14px",
            textTransform: "uppercase",
          }}
        >
          Back
        </button>
        <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 20 }}>Print Preview</div>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            background: "#fff3dd",
            border: "1px solid rgba(255,255,255,0.24)",
            borderRadius: 999,
            color: "#6f0d19",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.05em",
            padding: "9px 14px",
            textTransform: "uppercase",
          }}
        >
          Print
        </button>
      </div>

      <div style={{ margin: "0 auto", maxWidth: 980, padding: "18px 14px 28px" }}>
        <div
          style={{
            background: "#fffdf8",
            border: "1px solid rgba(111,13,25,0.12)",
            borderRadius: 16,
            color: "#5f5a54",
            marginBottom: 16,
            padding: 16,
          }}
        >
          <strong style={{ color: "#6f0d19", display: "block", marginBottom: 6 }}>iPhone Print</strong>
          <span>{helpText}</span>
        </div>

        {!payload ? (
          <div
            style={{
              background: "#fffdf8",
              border: "1px solid rgba(111,13,25,0.12)",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <p style={{ margin: "0 0 12px" }}>No print data was found for this session.</p>
            <Link href="/admin/orders" style={{ color: "#6f0d19", fontWeight: 700 }}>
              Return to admin
            </Link>
          </div>
        ) : (
          <>
            <style>{payload.css}</style>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(17,17,17,0.08)",
                borderRadius: 18,
                overflow: "auto",
                padding: 12,
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: payload.html }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
