"use client";

import { useState } from "react";
import PrintButton from "@/components/admin/PrintButton";
import { saveOrderShipmentDetails } from "@/lib/admin/order-actions";
import type { ShippingLabelPayload } from "@/lib/shipping-labels";

type Props = {
  orderId: string;
  orderStatus: string;
  shippingPartner: string | null;
  awbCode: string | null;
  shippingCode: string | null;
  label: ShippingLabelPayload | null;
  returnAddressReady: boolean;
};

export default function OrderShipmentPanel({
  orderId,
  orderStatus,
  shippingPartner,
  awbCode,
  shippingCode,
  label,
  returnAddressReady,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const eligibleForShipping = ["paid", "processing", "packed", "shipped", "delivered"].includes(orderStatus);

  async function copy(value: string, message: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setToast(message);
    } catch {
      setToast("Clipboard copy failed");
    }
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="admin-card" style={{ position: "relative" }}>
      {toast ? <div className="copy-toast">{toast}</div> : null}
      <div className="chart-card-head">
        <h3>Shipment</h3>
        <span>{eligibleForShipping ? "Store courier details and print label" : "Set to paid or later first"}</span>
      </div>

      <form action={saveOrderShipmentDetails} className="admin-form">
        <input type="hidden" name="id" value={orderId} />
        <label>
          Shipping Partner
          <input name="shippingPartner" defaultValue={shippingPartner ?? ""} placeholder="Shiprocket, Delhivery, India Post" />
        </label>
        <label>
          AWB Code
          <input name="awbCode" defaultValue={awbCode ?? ""} placeholder="Air waybill number" />
        </label>
        <label>
          Shipping Code / Tracking Code
          <input name="shippingCode" defaultValue={shippingCode ?? ""} placeholder="Shipment or tracking code" />
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="primary-button" type="submit" style={{ width: "fit-content" }}>
            Save Shipment Details
          </button>
          {awbCode ? (
            <button
              type="button"
              className="secondary-button"
              style={{ width: "fit-content" }}
              onClick={() => void copy(awbCode, "AWB copied to clipboard")}
            >
              Copy AWB
            </button>
          ) : null}
          {shippingCode ? (
            <button
              type="button"
              className="secondary-button"
              style={{ width: "fit-content" }}
              onClick={() => void copy(shippingCode, "Shipping code copied to clipboard")}
            >
              Copy Shipping Code
            </button>
          ) : null}
          {label && returnAddressReady ? (
            <PrintButton
              className="secondary-button"
              sheetId="single-shipping-print-sheet"
              title={`Shipping Label ${label.orderNumber}`}
              variant="shipping"
            >
              Print This Label
            </PrintButton>
          ) : null}
        </div>
      </form>

      {!returnAddressReady ? (
        <p className="form-error" style={{ marginTop: 12 }}>
          Return-to address is incomplete. Update it in Admin Settings before printing labels.
        </p>
      ) : null}

      {label && returnAddressReady ? (
        <div id="single-shipping-print-sheet" className="shipping-print-sheet" style={{ marginTop: 16 }}>
          <article className="shipping-print-card">
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
              <span>1/1</span>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
