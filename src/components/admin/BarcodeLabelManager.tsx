"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PrintButton from "@/components/admin/PrintButton";

type LabelSize = "38x25" | "50x25" | "60x30";

type BarcodeLabel = {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  barcodeValue: string | null;
  barcodeType: string;
  svg: string | null;
};

type Props = {
  labels: BarcodeLabel[];
  labelSize: LabelSize;
};

export default function BarcodeLabelManager({ labels, labelSize }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    labels.length === 1 && labels[0]?.svg ? [labels[0].id] : [],
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(labels.map((label) => [label.id, 1])),
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const printableLabels = useMemo(
    () =>
      labels.flatMap((label) => {
        if (!selectedSet.has(label.id) || !label.svg) return [];
        const copies = Math.max(1, Math.min(500, Number(quantities[label.id] ?? 1)));
        return Array.from({ length: copies }, (_, index) => ({
          ...label,
          cloneKey: `${label.id}-${index + 1}`,
          copyNo: index + 1,
          copies,
        }));
      }),
    [labels, quantities, selectedSet],
  );

  function toggleSelection(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) return current.includes(id) ? current : [...current, id];
      return current.filter((value) => value !== id);
    });
  }

  function setQuantity(id: string, rawValue: string) {
    const parsed = Number(rawValue);
    setQuantities((current) => ({
      ...current,
      [id]: Number.isFinite(parsed) && parsed > 0 ? Math.min(500, Math.floor(parsed)) : 1,
    }));
  }

  const selectableCount = labels.filter((label) => label.svg).length;

  return (
    <>
      <div className="chart-card" style={{ marginBottom: 18 }}>
        <div className="chart-card-head">
          <h3>Print Selection</h3>
          <span>
            {selectedIds.length} selected · {printableLabels.length} labels in queue
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setSelectedIds(labels.filter((label) => label.svg).map((label) => label.id))}
            disabled={!selectableCount}
          >
            Select All
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setSelectedIds([])}
            disabled={!selectedIds.length}
          >
            Clear
          </button>
          <PrintButton
            className="primary-button"
            sheetId="barcode-print-sheet"
            title="Vaibhavi Barcode Labels"
            disabled={!printableLabels.length}
          >
            Print Selected
          </PrintButton>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Tick the products you want, then set how many cloned labels to print for each selected barcode.
        </p>
      </div>

      <div className="dash-row dash-row-1-1" style={{ alignItems: "start" }}>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Available Barcodes</h3>
            <span>{labels.length} products</span>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {labels.map((label) => {
              const isSelected = selectedSet.has(label.id);
              return (
                <article
                  key={label.id}
                  className="admin-card"
                  style={{
                    padding: 14,
                    borderColor: isSelected ? "rgba(180,122,29,0.45)" : undefined,
                    boxShadow: isSelected ? "0 0 0 2px rgba(180,122,29,0.14)" : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "auto minmax(0, 1fr) 110px",
                      alignItems: "start",
                    }}
                  >
                    <label style={{ marginTop: 4 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!label.svg}
                        onChange={(event) => toggleSelection(label.id, event.target.checked)}
                      />
                    </label>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <strong style={{ display: "block", minWidth: 0 }}>{label.title}</strong>
                        <Link
                          href={`/admin/products/${label.id}`}
                          style={{
                            color: "var(--maroon)",
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          View Product
                        </Link>
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
                        {label.sku || "No SKU"} · {label.barcodeValue ?? "Pending"} · {label.barcodeType}
                      </div>
                      <div style={{ color: "var(--ink)", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                        {label.price}
                      </div>
                    </div>
                    <label style={{ display: "grid", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
                      Copies
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={quantities[label.id] ?? 1}
                        disabled={!isSelected || !label.svg}
                        onChange={(event) => setQuantity(label.id, event.target.value)}
                      />
                    </label>
                  </div>
                  {label.svg ? (
                    <div
                      className="barcode-print-sheet"
                      data-size={labelSize}
                      style={{ marginTop: 12, gridTemplateColumns: "repeat(1, minmax(var(--label-width), var(--label-width)))" }}
                    >
                      <article className="barcode-print-card">
                        <div className="barcode-print-head">
                          <strong className="barcode-print-title">{label.title}</strong>
                          <span className="barcode-print-sku">{label.sku || "No SKU"}</span>
                          <span className="barcode-print-price">{label.price}</span>
                        </div>
                        <div className="barcode-print-code" dangerouslySetInnerHTML={{ __html: label.svg }} />
                        <div className="barcode-print-foot">
                          <span>{label.barcodeValue ?? "Pending"}</span>
                          <span>{label.barcodeType}</span>
                        </div>
                      </article>
                    </div>
                  ) : (
                    <p style={{ color: "var(--muted)", fontSize: 12, margin: "12px 0 0" }}>
                      Save the product once to generate its barcode.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Print Queue</h3>
            <span>{printableLabels.length} labels ready</span>
          </div>
          {printableLabels.length ? (
            <div id="barcode-print-sheet" className="barcode-print-sheet" data-size={labelSize}>
              {printableLabels.map((label) => (
                <article key={label.cloneKey} className="barcode-print-card">
                  <div className="barcode-print-head">
                    <strong className="barcode-print-title">{label.title}</strong>
                    <span className="barcode-print-sku">{label.sku || "No SKU"}</span>
                    <span className="barcode-print-price">{label.price}</span>
                  </div>
                  <div className="barcode-print-code" dangerouslySetInnerHTML={{ __html: label.svg ?? "" }} />
                  <div className="barcode-print-foot">
                    <span>{label.barcodeValue ?? "Pending"}</span>
                    <span>
                      {label.copyNo}/{label.copies}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="chart-empty">
              Select one or more products on the left, then choose how many cloned labels to print for each one.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
