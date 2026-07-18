"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PrintButton from "@/components/admin/PrintButton";

type ShippingLabel = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  total: string;
  paidAt: string;
  source: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  itemCount: number;
  shippingPartner: string | null;
  awbCode: string | null;
  shippingCode: string | null;
  returnTo: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
};

export default function ShippingLabelManager({ labels }: { labels: ShippingLabel[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(labels.map((label) => label.id));
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(labels.map((label) => [label.id, 1])),
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const printableLabels = useMemo(
    () =>
      labels.flatMap((label) => {
        if (!selectedSet.has(label.id)) return [];
        const copies = Math.max(1, Math.min(50, Number(quantities[label.id] ?? 1)));
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
      [id]: Number.isFinite(parsed) && parsed > 0 ? Math.min(50, Math.floor(parsed)) : 1,
    }));
  }

  return (
    <>
      <div className="chart-card" style={{ marginBottom: 18 }}>
        <div className="chart-card-head">
          <h3>Bulk Shipping Labels</h3>
          <span>
            {selectedIds.length} selected · {printableLabels.length} labels ready
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setSelectedIds(labels.map((label) => label.id))}
            disabled={!labels.length}
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
            sheetId="shipping-print-sheet"
            title="Vaibhavi Shipping Labels"
            variant="shipping"
            disabled={!printableLabels.length}
          >
            Print Shipping Labels
          </PrintButton>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          Only paid orders with a saved shipping address are included here. Choose copies per order, then print the ready
          labels.
        </p>
      </div>

      <div className="dash-row dash-row-1-1" style={{ alignItems: "start" }}>
        <div className="chart-card">
          <div className="chart-card-head">
            <h3>Eligible Paid Orders</h3>
            <span>{labels.length} orders</span>
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
                        <strong style={{ display: "block", minWidth: 0 }}>{label.orderNumber}</strong>
                        <Link
                          href={`/admin/orders/${label.id}`}
                          style={{ color: "var(--maroon)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
                        >
                          View Order
                        </Link>
                      </div>
                      <div style={{ color: "var(--ink)", fontSize: 13, fontWeight: 700 }}>{label.customerName}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>
                        {label.phone}
                        {label.email ? ` · ${label.email}` : ""}
                        <br />
                        {label.itemCount} items · {label.total} · {label.source}
                        {label.shippingPartner || label.awbCode || label.shippingCode ? (
                          <>
                            <br />
                            {label.shippingPartner ? `Partner: ${label.shippingPartner}` : "Partner: —"}
                            {label.awbCode ? ` · AWB: ${label.awbCode}` : ""}
                            {label.shippingCode ? ` · Code: ${label.shippingCode}` : ""}
                          </>
                        ) : null}
                        <br />
                        Paid: {label.paidAt}
                      </div>
                    </div>
                    <label style={{ display: "grid", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
                      Copies
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={quantities[label.id] ?? 1}
                        disabled={!isSelected}
                        onChange={(event) => setQuantity(label.id, event.target.value)}
                      />
                    </label>
                  </div>
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
            <div id="shipping-print-sheet" className="shipping-print-sheet">
              {printableLabels.map((label) => (
                <article key={label.cloneKey} className="shipping-print-card">
                  <div className="shipping-print-top">
                    <strong className="shipping-print-order">{label.orderNumber}</strong>
                    <span className="shipping-print-paid">Paid</span>
                  </div>
                  {label.shippingPartner || label.awbCode || label.shippingCode ? (
                    <div className="shipping-print-shipment">
                      {label.shippingPartner ? <span>Partner: {label.shippingPartner}</span> : null}
                      {label.awbCode ? <span>AWB: {label.awbCode}</span> : null}
                      {label.shippingCode ? <span>Ship Code: {label.shippingCode}</span> : null}
                    </div>
                  ) : null}
                  <div className="shipping-print-name">{label.customerName}</div>
                  <div className="shipping-print-phone">{label.phone}</div>
                  <div className="shipping-print-address">
                    <span>{label.line1}</span>
                    {label.line2 ? <span>{label.line2}</span> : null}
                    <span>
                      {label.city}, {label.state} {label.pincode}
                    </span>
                    <span>{label.country}</span>
                  </div>
                  <div className="shipping-print-return">
                    <strong>If undelivered, return to</strong>
                    <span>{label.returnTo.name}</span>
                    {label.returnTo.phone ? <span>{label.returnTo.phone}</span> : null}
                    <span>{label.returnTo.line1}</span>
                    {label.returnTo.line2 ? <span>{label.returnTo.line2}</span> : null}
                    <span>
                      {label.returnTo.city}, {label.returnTo.state} {label.returnTo.pincode}
                    </span>
                    <span>{label.returnTo.country}</span>
                  </div>
                  <div className="shipping-print-meta">
                    <span>{label.total}</span>
                    <span>{label.itemCount} items</span>
                  </div>
                  <div className="shipping-print-bottom">
                    <span>{label.source}</span>
                    <span>
                      {label.copyNo}/{label.copies}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="chart-empty">Select paid orders on the left to prepare bulk shipping labels.</p>
          )}
        </div>
      </div>
    </>
  );
}
