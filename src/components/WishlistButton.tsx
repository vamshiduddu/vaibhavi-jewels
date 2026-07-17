"use client";

import { useState, useTransition } from "react";
import { toggleWishlist } from "@/lib/wishlist-actions";

export default function WishlistButton({
  productId,
  initiallySaved,
}: {
  productId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="secondary-button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleWishlist(productId);
          setSaved(result.added);
        })
      }
    >
      {saved ? "Saved to Wishlist" : "Add to Wishlist"}
    </button>
  );
}
