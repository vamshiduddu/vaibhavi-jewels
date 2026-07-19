"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    }, 220);
    return () => window.clearTimeout(id);
  }, [attempted, payload]);

  if (!payload) {
    return (
      <div style={{ background: "#fff", minHeight: "100vh", padding: 20 }}>
        <p style={{ margin: "0 0 12px" }}>No print data was found for this session.</p>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "#6f0d19",
            border: 0,
            borderRadius: 999,
            color: "#fff3dd",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 16px",
          }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="ios-print-root">
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        .ios-print-root {
          background: #ffffff;
          min-height: 100vh;
        }

        .ios-print-actions {
          position: fixed;
          right: 12px;
          bottom: 12px;
          z-index: 40;
          display: flex;
          gap: 10px;
        }

        .ios-print-action {
          background: rgba(111, 13, 25, 0.96);
          border: 0;
          border-radius: 999px;
          color: #fff3dd;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 10px 14px;
          text-transform: uppercase;
          box-shadow: 0 10px 24px rgba(26, 11, 12, 0.22);
        }

        .ios-print-stage {
          padding: 0;
          margin: 0;
        }

        @media screen {
          .ios-print-stage {
            display: flex;
            justify-content: center;
            padding: 12px;
            overflow: auto;
          }

          .ios-print-stage > .print-root {
            box-shadow: 0 10px 28px rgba(26, 11, 12, 0.08);
          }
        }

        @media print {
          html, body, .ios-print-root, .ios-print-stage {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
          }

          .ios-print-actions {
            display: none !important;
          }
        }
      `}</style>
      <style>{payload.css}</style>

      <div className="ios-print-actions">
        <button type="button" className="ios-print-action" onClick={() => router.back()}>
          Back
        </button>
        <button type="button" className="ios-print-action" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="ios-print-stage" dangerouslySetInnerHTML={{ __html: `<div class="print-root">${payload.html}</div>` }} />
    </div>
  );
}
