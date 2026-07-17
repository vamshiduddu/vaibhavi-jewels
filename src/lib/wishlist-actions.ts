"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const WISHLIST_COOKIE = "vj_wl";

export async function getWishlistSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(WISHLIST_COOKIE)?.value ?? null;
}

export async function toggleWishlist(productId: string) {
  const jar = await cookies();
  let sessionId = jar.get(WISHLIST_COOKIE)?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    jar.set(WISHLIST_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  const existing = await db.wishlistItem.findUnique({
    where: { sessionId_productId: { sessionId, productId } },
  });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await db.wishlistItem.create({ data: { sessionId, productId } });
  }
  revalidatePath("/wishlist");
  return { added: !existing };
}
