"use client";

import { useEffect, useState } from "react";
import { useZxing } from "react-zxing";

type LookupItem = {
  id: string;
  title: string;
  sku: string | null;
  barcodeValue: string | null;
  price: number;
  stockQuantity: number;
  status: string;
};

type Props = {
  name: string;
  label?: string;
  enableScanner?: boolean;
};

async function fetchLookupItems(query: string, signal?: AbortSignal): Promise<LookupItem[]> {
  const response = await fetch(`/api/admin/products/lookup?q=${encodeURIComponent(query)}`, {
    signal,
    credentials: "same-origin",
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { items?: LookupItem[] };
  return data.items ?? [];
}

function getBestMatch(query: string, items: LookupItem[]): LookupItem | null {
  const needle = query.trim().toUpperCase();
  return (
    items.find((item) => item.barcodeValue?.toUpperCase() === needle) ??
    items.find((item) => item.sku?.toUpperCase() === needle) ??
    items[0] ??
    null
  );
}

function MobileScanner({
  open,
  onDetected,
  onClose,
}: {
  open: boolean;
  onDetected: (value: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState("");
  const { ref, torch } = useZxing({
    paused: !open,
    formats: ["linear_codes", "qr_code"],
    constraints: {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    },
    trySkew: true,
    timeBetweenDecodingAttempts: 220,
    onDecodeResult(result) {
      const value = result.rawValue.trim();
      if (!value || value === lastScan) return;
      setLastScan(value);
      onDetected(value);
    },
    onError(scanError) {
      const message =
        scanError instanceof Error ? scanError.message : "Camera access failed.";
      setError(message);
    },
  });

  useEffect(() => {
    return () => {
      if (torch.isOn) {
        void torch.off().catch(() => undefined);
      }
    };
  }, [torch]);

  return (
    <div
      className="admin-card"
      style={{ display: "grid", gap: 12, padding: 14, background: "#fff8ef" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>Camera Scanner</strong>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
      <video
        ref={ref}
        muted
        playsInline
        style={{
          width: "100%",
          borderRadius: 10,
          background: "#140d0b",
          aspectRatio: "4 / 3",
          objectFit: "cover",
        }}
      />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {torch.isAvailable ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void (torch.isOn ? torch.off() : torch.on()).catch(() => undefined);
            }}
          >
            {torch.isOn ? "Torch Off" : "Torch On"}
          </button>
        ) : null}
        <small style={{ color: "var(--muted)" }}>
          Point the camera at a barcode or QR. Matching product will be selected automatically.
        </small>
      </div>
      {error ? <p className="form-error" style={{ margin: 0 }}>{error}</p> : null}
    </div>
  );
}

export default function ProductLookupField({
  name,
  label = "Product Lookup",
  enableScanner = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LookupItem[]>([]);
  const [selected, setSelected] = useState<LookupItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const nextItems = await fetchLookupItems(query, controller.signal);
        setItems(nextItems);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  async function handleScan(value: string) {
    setLoading(true);
    setNotice(null);
    try {
      const nextItems = await fetchLookupItems(value);
      const match = getBestMatch(value, nextItems);
      setQuery(value);
      if (!match) {
        setSelected(null);
        setItems(nextItems);
        setNotice(`No matching product found for ${value}`);
        return;
      }
      setSelected(match);
      setItems([]);
      setNotice(`Scanned: ${match.title}`);
      setScannerOpen(false);
    } catch {
      setNotice("Scan succeeded, but lookup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8, position: "relative" }}>
      <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>
        {label}
        <input
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setSelected(null);
            setNotice(null);
            if (nextQuery.trim().length < 2) {
              setItems([]);
              setLoading(false);
            } else {
              setLoading(true);
            }
          }}
          placeholder="Search by product name, SKU, or barcode"
          autoComplete="off"
        />
      </label>

      {enableScanner ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setScannerOpen((current) => !current)}
          >
            {scannerOpen ? "Hide Scanner" : "Scan Barcode / QR"}
          </button>
          <small style={{ color: "var(--muted)" }}>
            For mobile staff login, open scanner and point camera at the product code.
          </small>
        </div>
      ) : null}

      {enableScanner && scannerOpen ? (
        <MobileScanner
          key="offline-mobile-scanner"
          open
          onDetected={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      ) : null}

      <input type="hidden" name={name} value={selected?.id ?? ""} />

      {selected ? (
        <div className="form-success" style={{ margin: 0 }}>
          Selected: {selected.title} · {selected.sku || "No SKU"} · Stock {selected.stockQuantity}
        </div>
      ) : null}

      {notice && !selected ? (
        <div className="form-success" style={{ margin: 0 }}>
          {notice}
        </div>
      ) : null}

      {loading ? <small style={{ color: "var(--muted)" }}>Searching...</small> : null}

      {!selected && items.length ? (
        <div className="lookup-menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="lookup-item"
              onClick={() => {
                setSelected(item);
                setQuery(item.barcodeValue || item.sku || item.title);
                setItems([]);
                setNotice(null);
              }}
            >
              <strong>{item.title}</strong>
              <span>
                {item.sku || "No SKU"}{item.barcodeValue ? ` · ${item.barcodeValue}` : ""} · Stock {item.stockQuantity}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
