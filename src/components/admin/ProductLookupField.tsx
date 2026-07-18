"use client";

import { useEffect, useState } from "react";

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
};

export default function ProductLookupField({ name, label = "Product Lookup" }: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LookupItem[]>([]);
  const [selected, setSelected] = useState<LookupItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/products/lookup?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          credentials: "same-origin",
        });
        if (!res.ok) {
          setItems([]);
          return;
        }
        const data = (await res.json()) as { items?: LookupItem[] };
        setItems(data.items ?? []);
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

  return (
    <div style={{ display: "grid", gap: 8, position: "relative" }}>
      <label style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 600 }}>
        {label}
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
          }}
          placeholder="Search by product name, SKU, or barcode"
          autoComplete="off"
        />
      </label>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      {selected ? (
        <div className="form-success" style={{ margin: 0 }}>
          Selected: {selected.title} · {selected.sku || "No SKU"} · Stock {selected.stockQuantity}
        </div>
      ) : null}
      {loading ? (
        <small style={{ color: "var(--muted)" }}>Searching...</small>
      ) : null}
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
