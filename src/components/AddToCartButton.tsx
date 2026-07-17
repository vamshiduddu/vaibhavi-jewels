"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart-actions";

type Props = {
  productId: string;
  disabled?: boolean;
};

export default function AddToCartButton({ productId, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <button
        className="primary-button"
        disabled={disabled || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await addToCart(productId);
            if (result?.ok === false) {
              setError(result.error ?? "Could not add to cart.");
            } else {
              router.push("/cart");
            }
          });
        }}
      >
        {disabled ? "Out of Stock" : pending ? "Adding..." : "Add to Cart"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </>
  );
}
