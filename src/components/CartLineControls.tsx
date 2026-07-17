"use client";

import { useTransition } from "react";
import { removeCartItem, updateCartItem } from "@/lib/cart-actions";

export default function CartLineControls({
  itemId,
  quantity,
  max,
}: {
  itemId: string;
  quantity: number;
  max: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="qty-controls">
        <button
          disabled={pending || quantity <= 1}
          onClick={() => startTransition(() => updateCartItem(itemId, quantity - 1))}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span>{quantity}</span>
        <button
          disabled={pending || quantity >= max}
          onClick={() => startTransition(() => updateCartItem(itemId, quantity + 1))}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button
        className="remove-button"
        disabled={pending}
        onClick={() => startTransition(() => removeCartItem(itemId))}
        style={{ marginTop: 8 }}
      >
        Remove
      </button>
    </div>
  );
}
