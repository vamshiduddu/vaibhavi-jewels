"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrder } from "@/lib/checkout-actions";
import type { ShippingCountry } from "@/lib/pricing";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutForm({
  onlinePayments,
  countries,
}: {
  onlinePayments: boolean;
  countries: ShippingCountry[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.mode === "manual") {
        router.push(`/order/${result.orderId}`);
        router.refresh();
        return;
      }
      if (!window.Razorpay) {
        setError("Payment library failed to load. Please refresh and try again.");
        return;
      }
      setPaying(true);
      const razorpay = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: result.currency,
        name: "Vaibhavi Jewels",
        description: `Order ${result.orderNumber}`,
        image: "/vaibhavi-logo.png",
        order_id: result.razorpayOrderId,
        prefill: {
          name: result.name,
          email: result.email ?? undefined,
          contact: result.phone,
        },
        theme: { color: "#650815" },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const data = await verify.json();
          if (data.ok) {
            router.push(`/order/${result.orderId}`);
            router.refresh();
          } else {
            setPaying(false);
            setError(data.error ?? "Payment verification failed. Contact us on WhatsApp.");
          }
        },
      });
      razorpay.open();
    });
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <form action={handleSubmit} className="form-grid">
        <label>
          Full Name
          <input name="name" required autoComplete="name" />
        </label>
        <div className="form-row-2">
          <label>
            Phone
            <input name="phone" required autoComplete="tel" inputMode="tel" />
          </label>
          <label>
            Email (optional)
            <input name="email" type="email" autoComplete="email" />
          </label>
        </div>
        <label>
          Address Line 1
          <input name="line1" required autoComplete="address-line1" />
        </label>
        <label>
          Address Line 2 (optional)
          <input name="line2" autoComplete="address-line2" />
        </label>
        <div className="form-row-2">
          <label>
            City
            <input name="city" required autoComplete="address-level2" />
          </label>
          <label>
            State
            <input name="state" required autoComplete="address-level1" />
          </label>
        </div>
        <div className="form-row-2">
          <label>
            Pincode
            <input name="pincode" required inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" />
          </label>
          <label>
            Country
            <select name="country" defaultValue="IN" autoComplete="country-name">
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {!onlinePayments ? (
          <p className="form-success">
            Pay after confirmation — we will contact you on WhatsApp with payment details once
            your order is placed.
          </p>
        ) : null}
        <button className="primary-button" type="submit" disabled={pending || paying}>
          {paying
            ? "Completing payment..."
            : pending
              ? "Placing order..."
              : onlinePayments
                ? "Pay Securely"
                : "Place Order"}
        </button>
      </form>
    </>
  );
}
